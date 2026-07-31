import { expect, test } from "@playwright/test";

import { binaryFixture, fixtureIds } from "./services/fixtures";
import { acceptanceUrls } from "./environment";

const tokenFor = (subject: string) =>
  `fixture.${Buffer.from(JSON.stringify({ sub: subject })).toString("base64url")}.signature`;

test("fixture capabilities are deterministic and isolated by identity", async ({
  request,
}, testInfo) => {
  const subject = `acceptance-worker-${testInfo.parallelIndex}`;
  const otherSubject = `${subject}-other`;
  const headers = { Authorization: `Bearer ${tokenFor(subject)}` };
  const otherHeaders = { Authorization: `Bearer ${tokenFor(otherSubject)}` };

  await request.put(`http://127.0.0.1:4314/scenario/${subject}`);
  await request.put(`http://127.0.0.1:4314/scenario/${otherSubject}`);

  const projects = await (
    await request.get(`${acceptanceUrls.dataManager}/project`, { headers })
  ).json();
  expect(projects.projects[0]).toMatchObject({
    administrators: [subject],
    observers: [`${subject}-observer`],
    organisation_id: fixtureIds.organisation,
    unit_id: fixtureIds.unit,
  });
  const otherProjects = await (
    await request.get(`${acceptanceUrls.dataManager}/project`, { headers: otherHeaders })
  ).json();
  expect(otherProjects.projects[0].administrators).toEqual([otherSubject]);

  const units = await (
    await request.get(`${acceptanceUrls.accountServer}/unit`, { headers })
  ).json();
  expect(units.units[0].organisation.users).toContainEqual({ id: subject });
  expect(units.units[0].units[0].users).toContainEqual({ id: `${subject}-observer` });

  const failure = await request.get(`${acceptanceUrls.dataManager}/__failure/429`, { headers });
  expect(failure.status()).toBe(429);
  await expect(failure.json()).resolves.toEqual({ error: "fixture-rate-limited" });

  const binary = await request.get(
    `${acceptanceUrls.dataManager}/dataset/${fixtureIds.dataset}/1`,
    { headers },
  );
  expect(await binary.body()).toEqual(binaryFixture);

  const upload = await request.post(`${acceptanceUrls.dataManager}/dataset`, {
    headers,
    multipart: {
      dataset_file: {
        buffer: Buffer.from("fixture upload"),
        mimeType: "chemical/x-mdl-sdfile",
        name: "upload.sdf",
      },
      dataset_type: "chemical/x-mdl-sdfile",
      unit_id: fixtureIds.unit,
    },
  });
  expect(upload.status()).toBe(202);
  await expect(upload.json()).resolves.toMatchObject({ task_id: fixtureIds.task });

  const taskStates: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    const task = await (
      await request.get(`${acceptanceUrls.dataManager}/task/${fixtureIds.task}`, { headers })
    ).json();
    taskStates.push(task.states.at(-1).state as string);
  }
  expect(taskStates).toEqual(["PENDING", "STARTED", "SUCCESS"]);

  const diagnostic = await (await request.get(`http://127.0.0.1:4314/scenario/${subject}`)).json();
  const otherDiagnostic = await (
    await request.get(`http://127.0.0.1:4314/scenario/${otherSubject}`)
  ).json();
  expect(diagnostic).toMatchObject({ pollingIndex: 3, upload: { bytes: expect.any(Number) } });
  expect(otherDiagnostic).toMatchObject({
    pollingIndex: 0,
    requests: [{ path: "/project", subject: otherSubject }],
  });
});

test("production build logs in and performs an authenticated generated-client read", async ({
  page,
  request,
}, testInfo) => {
  const subject = `acceptance-worker-${testInfo.parallelIndex}`;
  await request.put(`http://127.0.0.1:4314/scenario/${subject}`);

  await page.goto("datasets");
  await expect(page.getByRole("heading", { name: "Acceptance identity provider" })).toBeVisible();
  await page.getByLabel("Username").fill(subject);
  await page.getByLabel("Password").fill("acceptance-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(`${acceptanceUrls.app}datasets`);
  await page.goto(acceptanceUrls.app);
  await expect(page.getByText("Data Manager: 6.7.0-acceptance")).toBeVisible();
  await expect(page.getByText("Account Server: 4.7.0-acceptance")).toBeVisible();

  const diagnostic = await (await request.get(`http://127.0.0.1:4314/scenario/${subject}`)).json();
  const generatedClientRequest = diagnostic.requests.find(
    (entry: { method: string; path: string }) =>
      entry.method === "GET" && entry.path === "/version",
  );
  expect(generatedClientRequest).toMatchObject({
    authorization: expect.stringMatching(/^Bearer /u),
    subject,
  });
});
