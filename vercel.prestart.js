const fs = require('fs');

const ENV = process.env.VERCEL_ENV;
const URL = process.env.VERCEL_URL;
const REPO_SLUG = process.env.VERCEL_GIT_REPO_SLUG;
const REPO_OWNER = process.env.VERCEL_GIT_REPO_OWNER;
const COMMIT_REF = process.env.VERCEL_GIT_COMMIT_REF;

const domain = 'vercel.app';

const url = () => {
  if (ENV === 'production' && REPO_SLUG) {
    return `${REPO_SLUG}.${domain}`;
  }

  if (COMMIT_REF !== 'master' && COMMIT_REF !== 'main' && REPO_SLUG && COMMIT_REF && REPO_OWNER) {
    return `${REPO_SLUG}-git-${COMMIT_REF}-${REPO_OWNER}.${domain}`;
  }

  return URL ?? '';
};
const vercel_url = url();

console.info(`Deploying to ${vercel_url}`);

fs.appendFileSync('.env.local', `\nVERCEL_URL="${vercel_url}"\n`);
