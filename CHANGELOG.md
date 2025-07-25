# Changelog

All notable changes to this project will be documented in this file.

## [5.6.0-dev.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.6.0-dev.1...5.6.0-dev.2) (2025-07-24)


### Features

* improve event stream connection logging ([aa8235d](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa8235d090bcd448032d5ffbd3aa868a4d53c9c1))


### Miscellaneous Chores

* release 5.6.0-dev.2 ([22cc9aa](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/22cc9aa95c82d2fe66c4538b0198cc0b399caa17))

## [5.6.0-dev.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.6.0-dev.0...5.6.0-dev.1) (2025-07-24)


### Features

* add event stream history ([#1691](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1691)) ([50d289f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/50d289fcf43c33dd14ab1ee475fe67b18975e961))
* improve design of app, job and workflow cards ([3007b98](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3007b9892daa599179aafe210e6ac1faa3c9ab73))


### Bug Fixes

* avoid es connections when it is not installed ([8379209](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8379209ddb379ae59e4ef6e09c5568c789a74889))
* fix default name for jobs to be usable ([fd1ae2f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fd1ae2f3d3e7c1610c38be7a0bc95d372e6a047a))
* fix MUI warning for project flavour ([89389df](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/89389df1dfc43872dd0a287c7e35bd63311ab634))
* pin nodejs version in devcontainer ([2e7dbf6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2e7dbf60195492924ceff8ab19be53e29d6d03b2))


### Miscellaneous Chores

* release 5.6.0-dev.1 ([76d5289](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/76d528988673fc1402ac12dd275bdc012fdf46fd))

## [5.6.0-dev.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.6.0-rc.1...5.6.0-dev.0) (2025-07-19)


### Features

* display workflows in result page ([167b54c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/167b54c6a4a5f9dfc220a3e918a0df377c117f53))


### Bug Fixes

* fix crash when order is undefined ([832ca50](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/832ca504f43e083e920e16fd7f1f0c428e51ae64))
* show header only when there is an input ([a745a42](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a745a4254a04be80dcd529f87f6672f45a9392e2))


### Miscellaneous Chores

* release 5.6.0-dev.0 ([6e3eefc](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6e3eefc82dd46e1073f4baa5e28028194a03078a))

## [5.6.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.6.0-rc.0...5.6.0-rc.1) (2025-05-29)


### Bug Fixes

* fix workflows with options ([54ce29a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/54ce29a049164b09d0bb7a0d3abcef18405c5561))
* show all instances in the list with their version ([a51042e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a51042ea4b25582617f7453fe7f9213e84b0adc7))


### Miscellaneous Chores

* release 5.6.0-rc.1 ([1da8cf6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1da8cf692780676deb9acfd3dc91f8acfab408a6))

## [5.6.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.5.0...5.6.0-rc.0) (2025-05-28)


### Features

* add workflows to run page ([aae3495](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aae34953c1f7868b425371d6dbbc4345ecc61912))


### Miscellaneous Chores

* release 5.6.0-rc.0 ([54fbb29](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/54fbb2939b00283d125a521d846914b461ac0fed))

## [5.5.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.4.0...5.5.0) (2025-05-27)


### Features

* add keyboard shortcut for search field ([76df00a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/76df00aff22c16ad7c0cb78c75ad477088b4b53c))
* group jobs by their versions ([0754dab](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0754dab057e614e720f6f04f799c087b2721ff54))


### Bug Fixes

* update lockfile ([c056355](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c056355a03edf80e69ff68eb781233202898fb59))

## [5.4.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.3.0-rc.2...5.4.0) (2025-05-15)


### Features

* add option to toggle event stream functionality ([14faede](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/14faede7d79eda7ecdc192a0b36ae128d6d2e2be))


### Bug Fixes

* avoid connecting to event stream when user is not authenticated ([c824c91](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c824c91bf33328b0f30d43e65d634f86eddcd571))
* correct permissions for unit actions ([df1c820](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/df1c8205ace5ba0e5c181f5aedf0afddb16d472e))
* correct permissions project actions ([b0bca9d](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b0bca9d4c22a507dd741e8b0d0f751ee1b7cc1fb))
* fix layout shift caused by navigation progress bar ([e8cfdad](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e8cfdadcefd5b550242aa78628a11efdb86b5653))
* fix, temporarily, an error when selecting projects from the settings dialog when on the products page ([37c07d3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/37c07d31b1753a22fb72533a016954318d754fcd))


### Miscellaneous Chores

* release 5.4.0 ([77e4b06](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/77e4b06fe1179c4fda84a8b4517fa01f73d32b1b))

## [5.3.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.3.0-rc.1...5.3.0-rc.2) (2025-04-18)


### Features

* improve appearance of toast messages ([6aa35bc](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6aa35bc9ee2b79df1a0845c5059f08a935647aed))


### Bug Fixes

* improve websocket error handling ([380d03a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/380d03ac2f6ec83452cf852cc534979cadb7adf0))


### Miscellaneous Chores

* release 5.3.0-rc.2 ([61d8599](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/61d8599b6b23ccb440918817a7fb99e61e4ebc50))

## [5.3.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.3.0-rc.0...5.3.0-rc.1) (2025-04-15)


### Features

* display realtime event messages ([0dc1a5a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0dc1a5a20edc4e6ca63249571432b30451fee9b0))


### Miscellaneous Chores

* release 5.3.0-rc.1 ([672b4f3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/672b4f37c0c67dcc8ecac9d2c5cf0002fc7fe6e2))

## [5.3.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.2.1...5.3.0-rc.0) (2025-03-15)


### Features

* setup event stream connection via web socket and display events ([01e1adb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/01e1adb827c5bb84599bd6d53d3f26dc53148638))


### Miscellaneous Chores

* release 5.3.0-rc.0 ([da9c183](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/da9c183bc021f805b59d4ce0e3f13e04b4190f70))

## [5.2.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.2.0-rc.0...5.2.1) (2025-03-15)


### Bug Fixes

* fix spacing of molcards ([8222c95](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8222c95d5fc25b6667d0d01a65fb3e31d4264f44))


### Miscellaneous Chores

* release 5.2.1 ([30f6222](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/30f62229557977f59efb53eea5b0a5bb484d3bc5))

## [5.2.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.1.1-rc.0...5.2.0-rc.0) (2025-01-27)


### Features

* **sdf:** add basic support for sdf without a schema ([4f8dec4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4f8dec488a43e73dd6660c21f79aacecbba18d2b))


### Bug Fixes

* **navigation:** fix navigation issues that appeared in recent commit ([e624325](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e6243254163f829110bf2657a17cb96ac4fb502f))

## [5.1.1-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.1.0-rc.0...5.1.1-rc.0) (2025-01-25)


### Bug Fixes

* show error when no sdf schema if found ([02a32d2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/02a32d2c9575e8907922615f0078ce0bda1b87e3))

## [5.1.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.1.0...5.1.0-rc.0) (2025-01-20)


### Bug Fixes

* fix sdf viewer from giving 404 error when submitting config ([9769c22](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9769c224dd9f6a5ea3f71abe5cd7bfe46f6fff04))


### Miscellaneous Chores

* release 5.1.1-rc.0 ([b432010](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b432010d2e475d8891c60c501bf810226ae6c485))

## [5.1.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/5.0.0...5.1.0) (2025-01-05)


### Features

* display job exit code on result card ([242dd9a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/242dd9a3180ae8221d0518865c0d66ea2069dbce)), closes [#1320](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1320)


### Bug Fixes

* fix issues with the ui test job ([b17cc23](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b17cc23d89d030a0135630f202538f22db140a17))
* fix position of toolbar buttons in the project table ([68c3884](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/68c388476e02306b1f49874e46943b00ffe00dda))
* fix unit ledger not showing a total amount when it is zero ([ef5c6d1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/ef5c6d1be872ff420a31881e5529e9107ae1973e)), closes [#1431](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1431)

## [5.0.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/4.0.0...5.0.0) (2024-11-07)


### ⚠ BREAKING CHANGES

* **api:** UI now requires AS API v4

### Features

* **api:** update account server API to v4 ([e4def65](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e4def652ae9ce2b95d85f912aa95c83af823b763))

## [4.0.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/4.0.0-rc.0...4.0.0) (2024-08-13)


### Miscellaneous Chores

* release 4.0.0 ([e4ed5e7](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e4ed5e7082e3a2e2671114230f7149e046aafe50))

## [4.0.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.3.0...4.0.0-rc.0) (2024-08-12)


### Bug Fixes

* fix breaking changes caused by AS 3.0.0 update ([8cb78e1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8cb78e1f7b76979a4fffbb2329b483d835dbe3f9))
* update nextjs routes file ([da69df9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/da69df9762b43e34e488f4006963e2c78f253d74))


### Miscellaneous Chores

* release 4.0.0-rc.0 ([d1cb214](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d1cb2143b57d5468cdd08c6ad5bb51f38d01d1c8))

## [3.3.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.3.0-rc.3...3.3.0) (2024-08-02)


### Miscellaneous Chores

* release 3.3.0 ([3a37563](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3a375639b2607674684ff2496efbc68018e3f418))

## [3.3.0-rc.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.3.0-rc.2...3.3.0-rc.3) (2024-08-02)


### Bug Fixes

* hide units for which a user is only a project observer ([b3e8c6f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b3e8c6f4f6a2f74a97ccc1de4f37af1bbc1bee58))


### Miscellaneous Chores

* release 3.3.0-rc.3 ([a0b428b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a0b428bc17a376cac5ea012c48e81f04b1ddacae))

## [3.3.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.3.0-rc.1...3.3.0-rc.2) (2024-08-02)


### Features

* include missing units to organisation usage page ([133e410](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/133e4106b162dbbb1490f3a2f32f48e254550943))


### Bug Fixes

* text clarification on settings page ([b423520](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b423520a64cd798678f0cccff038afe380be51b8))


### Miscellaneous Chores

* release 3.3.0 ([af64de0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/af64de085db6ee73bf8251a206f13f1b7fa1ff91))
* release 3.3.0-rc.2 ([531ff43](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/531ff43dd98505114591346021889f2df14561e7))

## [3.3.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.3.0-rc.0...3.3.0-rc.1) (2024-07-23)


### Features

* add button to access organisation inventory page ([64aaa56](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/64aaa5615ba220ec95d02597e04d10574f4536e2))


### Miscellaneous Chores

* release 3.3.0-rc.1 ([3a281e6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3a281e6aa5f54884fd035fd8d6f9fd34124b2133))

## [3.3.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.2.0...3.3.0-rc.0) (2024-07-16)


### Features

* add initial version of organisation inventory ([0515418](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0515418ae6eef71b2c6f844824b6a7243fe50feb))


### Bug Fixes

* **auth:** fix error message ([023feee](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/023feee6ccddf992051b3f340166b380a3489b9f))
* **nextjs:** fix loading of env var as "undefined" ([cf0be89](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/cf0be89888403d7bdcad92d771687abfc656d0e9))


### Miscellaneous Chores

* release 3.3.0-rc.0 ([07c1d4f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/07c1d4f0713450c913be52483236c14452fa7420))

## [3.2.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.2.0-rc.2...3.2.0) (2024-05-16)


### Bug Fixes

* **move-file-mutation:** fix invalidation of cache when moving a file ([5b974d0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5b974d00f1f515ca0503a1fe0ca64d3cf1420984))


### Miscellaneous Chores

* release 3.2.0 ([077cede](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/077cedefbd9fbdef1e7f54c47cd0f9ee5192215c))

## [3.2.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.2.0-rc.1...3.2.0-rc.2) (2024-05-09)


### Bug Fixes

* **edit-unit:** fix permissions of editing unit members, names and default privacy ([28289cb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/28289cb949a3841416206374e7f252e2286bf63c))


### Miscellaneous Chores

* release 3.2.0-rc.2 ([f401dbc](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f401dbc028a4695ecd3b95cdf66a9422aff09ce1))

## [3.2.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.2.0-rc.0...3.2.0-rc.1) (2024-05-01)


### Features

* **edit-unit:** add option to change a unit's default product privacy ([b6a22a6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b6a22a6622d5c40f8cf4444b174c2722f8682e5b))


### Bug Fixes

* fix texts in some file actions ([254b764](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/254b764a3d4d80b38bb920ed42d1e955d8276e63))
* fix unnecessary request being made when a user isn't a unit member ([3ac4492](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3ac4492be685669618b3dc82b173f58ed151fb3c))
* improve display of rename file/dir field ([aabcc7c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aabcc7ce9823785c3c37d6f5d37a9d198f2c6756))
* **project-selection:** fix project filter level changing when a project is selected ([769c23e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/769c23e5bdba8b3e92a511216c7ca85bd1b50e72))


### Miscellaneous Chores

* release 3.2.0-rc.1 ([7864fc9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/7864fc91c78f007c11f9310d14b1c08325c67207))

## [3.2.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.1.1...3.2.0-rc.0) (2024-04-29)


### Features

* **create-project:** support the default product privacy of units ([6a99669](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6a996699895a99c9b048c5548676c2729dc40a96))
* **project-page:** support file and directory rename/move ([e454a7f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e454a7fcec572f847a4ced63f9ccc8ecebc50a23))


### Bug Fixes

* **create-project:** change privacy switch back to a checkbox ([d404311](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d4043111c3c412d0c57736195a26cdd720897011))
* **create-project:** forward ref warning in CreateProjectForm.tsx ([9fe9208](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9fe92089801391f9223f7d3dc318d8b39e4f7b13))
* **create-project:** restore default project privacy value when changing flavour if field is untouched ([0b9c544](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0b9c544c20cddbad025913a8ac409cd7a09c9aaa))
* **dataset-actions:** allow user to attach a dataset to a project they are an admin ([43ac2f9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/43ac2f9ff1e28fda732eaa2fb2cf05d8272fe04f))
* **datasets-page:** stop request spam when upload finishes ([9155956](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9155956432275ed0d23ba8c9442064bc01bf9541))
* fix typos ([7441bb3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/7441bb3b3517dd498cb06c6fb8e4236d0eafd0c8))
* improve error message relay from api ([af3d025](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/af3d025dd885d31203094a390559a3f8b8af8d2e))
* **modals:** change some close button text to cancel ([424f3c9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/424f3c9128684a3a31349c8d07b2f9f05c613152))
* **project-selection:** fix alignment of unit and org inputs ([fa62cca](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fa62ccaa5d740be5766d56d07e3510ff0b746350))


### Miscellaneous Chores

* release 3.2.0-rc.0 ([97c6cac](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/97c6cac4dd0648ecd87c32e8a86cc01512aa0757))

## [3.1.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.1.0...3.1.1) (2024-04-21)


### Bug Fixes

* **run-job:** fix hydration issue with the options form ([31184ec](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/31184ecdf58b225a7f7c6a8996e29f52351ed5e4))
* **run-job:** remove error messages from console when validation fails ([582ca3c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/582ca3ccbd56892049c6bb3e8c7c2c20df4eec09))
* **run-job:** show error message correctly when empty smiles entries are used ([8d2b6b0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8d2b6b0c769ffa686b44d0170858e0dcef898f5c))
* **sketcher:** fix some sketcher issues caused by multiple sketchers being open ([ad75496](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/ad7549622f1c9a116d81873807b931b5ae929958))

## [3.1.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.1.0-rc.3...3.1.0) (2024-04-11)


### Bug Fixes

* **unit-user-usage:** remove percentage, fix spacing and disable column filtering for project columns ([4dca281](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4dca2818e91bcf9894ca66a5f2a5eb239ff89518))


### Miscellaneous Chores

* release 3.1.0 ([de25b9b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/de25b9b6ea29372d2337b2275a969fb4663cb8c4))

## [3.1.0-rc.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.1.0-rc.2...3.1.0-rc.3) (2024-04-09)


### Features

* **unit-user-usage:** add activity totals to table ([acdfbe7](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/acdfbe73841dea4ef7c85b7bbe1dc7cbf7801bc8))


### Bug Fixes

* **unit-user-usage:** disable autofocus on project form on this page only ([196f1c6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/196f1c6e4b4ae369e203a8d57d323795369da1b6))


### Miscellaneous Chores

* release 3.1.0-rc.3 ([eff4b97](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/eff4b97f47f3fe666c80b57c74f67bd57952a55b))

## [3.1.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.1.0-rc.1...3.1.0-rc.2) (2024-04-08)


### Features

* **unit-user-usage:** add create project form at bottom of table ([c3beb35](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c3beb3513bee448542faab8eddcc18b7543d5490))


### Bug Fixes

* **unit-user-usage:** change page titles and url ([9c3e2bd](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9c3e2bd45dbf46ca5ff7bc6abda1ab81db34b290))
* **unit-user-usage:** filter out selected projects ([d785342](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d7853429fdb1e2c05ed06ee5f752b30dc445c341))
* **unit-user-usage:** show error messages when there are api errors ([f8620e2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f8620e210afd6504abbe8afde93a2175aebe81c4))
* **unit-user-usage:** update dropdown label to "Add Project" ([83314c5](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/83314c56e304bf471a2bf5e9136b15e032c41701))
* **unit-user-usage:** update pivot toggle text ([eb62fe6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/eb62fe64403a30b0787b6b050e8038061c86967c))


### Miscellaneous Chores

* release 3.1.0-rc.2 ([2d2b9ab](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2d2b9ab38019a0ac70fc9a84cfdf682cdf86e4db))

## [3.1.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.0.0...3.1.0-rc.1) (2024-04-05)


### Features

* **unit-user-usage:** add initial implementation ([a901ec8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a901ec80492d1427185c05914e23e3226229b282))


### Bug Fixes

* fix new default_product_privacy property in selected org ([06b1d83](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/06b1d83bf2235e319ab5b6b60b88f1047c52161a))
* **unit-user-usage:** update activity columns to use new api ([cf756a3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/cf756a3933266b22871be141519d6e636611f60a))


### Miscellaneous Chores

* release 3.1.0-rc.1 ([99a5780](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/99a5780b937da0d6d01e4c4fbbd9a6f0d43b646e))

## [3.0.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.0.0-rc.5...3.0.0) (2024-03-12)


### Miscellaneous Chores

* release 3.0.0 ([71ae4d9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/71ae4d90853ed4755c4a4a5fb84dea547b8b437b))

## [3.0.0-rc.5](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.0.0-rc.4...3.0.0-rc.5) (2024-03-12)


### Bug Fixes

* **results-page:** imrpove project link on instances ([3d2de1f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3d2de1ffbfd8f9daa8a573254eb939472957623c))


### Miscellaneous Chores

* release 3.0.0-rc.5 ([6602afa](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6602afa914e57d0b3530e54b41e20b68c2554a5f))

## [3.0.0-rc.4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.0.0-rc.3...3.0.0-rc.4) (2024-03-11)


### Features

* **results-page:** add title to instance page and make project list item clickable ([3beb834](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3beb834f3780602e4c5100a2219a14bb9f80a769))


### Bug Fixes

* **project-selection:** fix predicted storage value in chart ([96dbf9e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/96dbf9e7f8ca17b7b71fde85330f4aa0c77b1a14))
* **project-stats:** fix text wrap and spacing of chart tooltip ([36d56ec](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/36d56ec0fb71c0965f335c4e67ed00e12387a127))


### Miscellaneous Chores

* release 3.0.0-rc.4 ([62f4d81](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/62f4d81fd772bf09a70a12771b9b1acb36584034))

## [3.0.0-rc.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.0.0-rc.2...3.0.0-rc.3) (2024-03-07)


### Bug Fixes

* **delete-project:** ensure user is creator of project ([548c570](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/548c570644bffaa41fa9243d8838b1b23c285991))
* **project-page:** fix delete directory logic for sub folders ([be28b40](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/be28b40dda7ff88258fdbc0c491b36b3188aa95a))
* **project-page:** fix enter key when creating project directories ([d828ceb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d828ceb6e9db45949f842a96a77e7d226160cf9d))
* **project-selection:** change permission level sleect to use administrator instead of owner ([7664203](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/7664203199ab9b1b7cbe77de12f988fd591ced5c))


### Miscellaneous Chores

* release 3.0.0-rc.3 ([748ba80](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/748ba80419e044e37a4348550292837bde08e129))

## [3.0.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/3.0.0-rc.1...3.0.0-rc.2) (2024-03-05)


### Bug Fixes

* **run-job:** fix run job button when job has no options ([81709a1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/81709a124b3c191cb4268b0050c6d418e64ccbec)), closes [#1257](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1257)
* **run-job:** navigate to new instance when re-run job button is used ([827a45c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/827a45c9debae1dba1a978dbfa1791e803aa782c)), closes [#1255](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1255)


### Performance Improvements

* **results-page:** use include exclude_purpose parameter to speed up request to tasks ([b893a4a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b893a4af2401438f65b1d4829225351046e77604)), closes [#1251](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1251)


### Miscellaneous Chores

* release 3.0.0-rc.2 ([a90ca6a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a90ca6a41aafdd785439d63d26b45908bdfe1915))

## [3.0.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/v3.0.0-rc.0...3.0.0-rc.1) (2024-03-05)


### ⚠ BREAKING CHANGES

* **actions:** Update changelog.md with to remove standard-version wording

### Features

* **api:** add a public ui-version endpoint ([5bb327a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5bb327abbba45fdbcdbfc9c7737b22a86d565f0c))
* **auth:** display auth error message in user menu ([5b295a1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5b295a106dcf615ff252da45ba72fa5fd0dfe207))
* **create-unit:** add option to create personal unit ([0df614b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0df614ba301292b5c6916c148960bfc6125195f0)), closes [#1021](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1021)
* **dataset-storage-table:** allow dataset products to be deleted from the settings window ([db3874e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/db3874ef628579f7d0194d2701bb3f65e7e99e66))
* improve sdf viewer action text and fix the maximum width of the pop-up ([4440a99](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4440a99ece3f746f6276d51611ac1be4cd46baf4))
* **project-bootstrap:** add the bstrapper to the settings dialogue and the project page ([b0f6358](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b0f6358f24c90319d942c0c333cb23e1a082176c))
* **project-bootstrap:** hide bootstrapper if the default org is hidden ([23ad5b4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/23ad5b4bfe98290851145c7a03164f1e56b263a6))
* **project-delete:** provide the project name in the delete project dialogue ([#1219](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1219)) ([2078676](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/20786768b15c683826088dc025958d84dda7354a)), closes [#1209](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1209)
* **project-page:** add option to create project directories ([6a0e1d0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6a0e1d0c0bb121dc95f6b4eebc695271c5b5a276))
* **project-page:** add option to delete directories ([6ff0226](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6ff0226f807bfda5f0f773f4b8dcfb7e50761603))
* **project-selection:** add a filter by "current user is the owner" option to org, unit and proj ([98299df](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/98299dffdc6403f04f45813629880ef333cc6f82)), closes [#1020](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1020)
* **project-selection:** add option to filter project name and owner columns ([00ddbd2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/00ddbd2d232483bf0dbbf2b0514eaa5577cc1440))
* **project-selection:** improve selection filter to give editor option ([1be8cd4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1be8cd400609ef4d85611a91bf979903ad427b1c))
* **project-selection:** set the default organisation as the default selection when no project is selected ([4fc2672](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4fc2672ea4ac828fed9c2e91d92c0385e3c88dc1))
* **project-stats:** add icon to show whether a project is private ([#1220](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1220)) ([be7f640](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/be7f6402313d12366cbd7a1d51460d7795ee094f)), closes [#1204](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1204)
* **run-job:** add test job card that only shows in development mode ([4098726](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/40987262188265575af4718437c9940fe50b32d4))
* **sdf-parser:** add first implementation of sdf filtering ([4e07937](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4e07937944fe4206d0d8442c009407d5c9a832b3))
* **sdf-viewer:** add card view property selection ([663473f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/663473f7a11168f1e02de02932c1f2df3779d431))
* **unit:** add UI to rename units ([aa8ffe9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa8ffe944b0f2551d8b6eb664a0e8ac57795a218)), closes [#1172](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1172)
* **user:** improve the look and content of the user menu ([fa8e16a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fa8e16a99f3585b8f90bc4b1890c51d0ddacd807))
* **viewers:** add SDF file viewer ([2e3e282](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2e3e282aa822841b99b2b608b9988719f7eae9ba))


### Bug Fixes

* **api:** cleanup /version API requests in the footer ([9bcdfb6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9bcdfb6be557a7c08e8bc9cdf00ef3c7ae83cc1a))
* **api:** fix admin/editor level permissions for v2 DM api ([35dd06c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/35dd06c5d0b6c49de69ea58802d495d47373d94f))
* **api:** fix breaking change caused by job variables inputs chaning from string to object ([aa53bbb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa53bbb636bbed81c83dc8eca51ff6461fceb8f7))
* **auth:** experimental test to fix 404 errors when navigating to certain pages without authentication ([327078b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/327078b69fcf93ab0f4ae697f0e0eafef86b467b))
* **auth:** final fix for 404 errors when navigating to protected pages when not loged-in ([45e6be0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/45e6be027286799b6dcfeff0c0412cb3319683c4))
* **auth:** fix auth logout issue ([6e04ce1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6e04ce15582e9ff0b717c184c0960fe226485b81))
* **auth:** fix datasets link from giving a 404 ([593e121](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/593e121a9ca0ba2d3001330b0b3cff2bd18495f2))
* **auth:** fix display of auth error messages ([ea68fc9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/ea68fc9ca088a1000b40b5e433d96f3fd11bb876))
* **auth:** fix login paths on base urls ([a3aff89](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a3aff8961ad8869fd306308076759b3470c507d8))
* **auth:** fix redirects from login ([dead1b8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/dead1b8b3772c0da5577867e347e60e37e7f2ef3))
* **authorization:** improve authorization to support evaluation role ([847e500](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/847e500f647c0664c6747f9ecf19a9ee9acad8e8))
* **context:** fix types ([f0dd662](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f0dd662e23eb7feb1f91cc5f8f72583185fb34ef))
* **create-project:** only show the button when users have permission for the selected unit ([5c82966](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5c829663c8f15f9d2cea509d01f2fb632bfe48dd))
* **create-project:** prevent private projects for the EVALUATION flavour ([3f91b14](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3f91b1493e73a17cf9545f8a34ad7a38710fad50))
* **create-unit:** move create unit actions to organisation column, fix when they're displayed and fix text ([f551659](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f5516596143b8a62a01e4549e9948d1e83c6f11b))
* **data-table:** fix search field changing sort direction ([d0761ca](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d0761ca441dcf5a9ac252a35b9f405bb6789857e))
* **dataset-sub-table:** stop showing dataset storage subscriptions when the unit doesn't have any ([dc8531a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/dc8531a24ee8fea4af50ca09564f531abcbbdc5a)), closes [#1022](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1022)
* **delete-project:** make the delete project dialogue clearer ([d330ac8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d330ac8a8b96db2ec6227f25fc63e4c1ecb0cffe))
* **deps:** pin nanoid and switch from uuid everywhere ([c087bba](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c087bba4b4e45ad527bc83d85bb3e7f0121506a7))
* **deps:** update dm client to fix data update issues ([7bee802](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/7bee8024815f1c75ef2050ca84f996882641b9cb))
* **deps:** upgrade material-ui-popup-state and fix breaking changes ([26c1bd8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/26c1bd8b0b51000cbf9d2ad708660284d1f8df50))
* display directories without text transform ([#1162](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1162)) ([a512883](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a5128832e9a88649ac5c8aa9c55334bb6d5b3f85)), closes [#1098](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1098)
* **docs:** add space between docs nav links for a better page experience ([38c3599](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/38c35999427f30dd26a555cb69f22070e9a63f24))
* **executions:** use new molcules-smi type ([3646501](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/364650185d54ac5e8b6ab4d6ea344f4370bd6ff1))
* **file-download:** fix file download when app is hosted on a sub path ([3c95ff1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3c95ff1ceb3edc42d9f848a0732a6f8b82ea5a6e))
* fix lint issue and change default error text ([abcd1be](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/abcd1be3457e8494c60f2f6c914ca8c304d1b349))
* fix linting errors created by yup update ([c24de89](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c24de89c6bccfe0dbd021f78c7e68ef921c5d6c8))
* **job-file-inputs:** display required indicator on inputs ([ff16e12](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/ff16e123eda8a9bf9f039ddcf29a6e7c8341620f))
* **navigation:** fix button positions on mobile ([733dfcd](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/733dfcd050f63cfab14e65c905c979677c36c0c5))
* **nextjs:** fix console noise created from last commit ([0e9c6d1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0e9c6d10be0629a64ae18c8a5ff76e0907c31282))
* **nextjs:** remove console noise created by nextjs update ([f619298](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f619298b9ab1cd7bcfa52beee9a5177316b2c1ea))
* **pnpm:** update lockfile ([f0bd671](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f0bd6716e3549a8e3a6f0ab13c15e4ec23dcc69f))
* **products:** prevent evaluating users from creating dataset storage subscriptions ([cf39545](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/cf39545eae32e59291b1950e3616b5ec00140a0c))
* **project-selection:** change default filter mode to editor and fix wording ([9df5adb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9df5adbff15a6a5923a4f091e2086dc21c837a9e))
* **project-selection:** change text in owner switch ([d92cbe2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d92cbe24d5057f8eff430a073e2321229a5c8edc))
* **project-selection:** fix create personal unit action appearing incorrectly ([f2d5ba0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f2d5ba065ba6753ff19fd38bf08ef3e27c3e7200))
* **project-selection:** fix default value of owner only filter ([44ac847](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/44ac847170cc4a61022fe2db4b283e8a2ec1e58b))
* **project-selection:** fix organisation selection from behaving strange when clearing it ([99252ef](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/99252ef383c26cd05da5e3a256daa122311d53fb))
* **project-selection:** fix project filtering by unit ([1782a17](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1782a175e04bc84a55bcca34c7cbcd575950a6d0))
* **project-selection:** fix some projects not showing up in the table when the user only has project editor permissions but is not a unit member ([559365e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/559365e5a173df7d4176ccfc86fe72cc296a0df7))
* **project-selection:** fix the selected unit when permission level changes ([a1be809](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a1be8098aca50b9744b8c76b07bb253993c0f368))
* **project-selection:** fix undefined showing up in selected org ([df5766f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/df5766f215e79d767e9e70649b73d81186239b4a))
* **project-selection:** fix url and local storage state when a project doesn't exist ([64bb0df](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/64bb0df62a87a3cf8f1059437ee97a59c66c1043))
* **project-selection:** keep all applicable projects in list if user is a unit member ([de4f5ef](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/de4f5efc2a306d8d4b591201e93083bd1c3d063a))
* **results-page:** fix rerun job functionality when job uses a smiles input ([0430748](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0430748cffb29bb1580ab18fa273f220a2ea5dba))
* **results-page:** hotfix result page causing an error when no project selected ([a13fca3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a13fca309335861f760402b9b7aea570f88d6afb))
* **run-job:** disable submit button when form is not valid ([f5d07ba](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f5d07bae47156caa763e6be4da381fe9cb92e06e)), closes [#1001](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1001)
* **run-job:** display errors on invalid job inputs ([96c01cb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/96c01cb73aca8f17dd9bdcb9317a8bc63dda4ed0))
* **run-job:** enable error list at bottom of options ([938d361](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/938d3612878212abad78c20c3a44f47da0500cb0))
* **run-job:** fix run button being disabled when using rerun functionality ([1b1c192](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1b1c19297f7ada37d941fdf05a97a0c432277bff))
* **run-job:** fix validation check of inputs ([82d68d2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/82d68d2b0083c08493b317b3cfb254fcf22f40a1))
* **run-job:** improve validility state of run job button ([fde9b28](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fde9b2845e8fc221b4376de414f506c189f74920))
* **sdf-parser:** fix sdf parser when hosted on a subpath ([8a7fdbd](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8a7fdbd59ad33fc1cd883cbaec9dd9b00d0e2d35))
* **sdf-viewer:** fix display of error messages ([d0daad7](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d0daad7420edad016bef316a8ff5d298bb6e57ee))
* **sdf-viewer:** use molfile to depict molecule ([1dab054](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1dab05478a59b496d59b0b2bac691b777a2e5c22))
* **sdf:** fix card view layout at certain screen sizes ([75e7e01](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/75e7e0198308092062ef1408a5855ecd8ffc5307))
* **settings:** fix admins column and size of columns in dataset storage section ([cb7cb01](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/cb7cb01a528e7d1748b646192b9c89e934082bb4))
* **settings:** fix filter text and dropdown label in new role selector ([baa1d19](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/baa1d198336f69875a1984c3bc2f19160aae0fec))
* **sketcher:** allow empty input to be saved ([093814e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/093814ea7733078f5c5f15f07a3e5793021caa10))
* **sketcher:** capture errors and send to sentry ([2747ebb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2747ebb1a5f8040b761a7ab0c6b7d38d14f805f5))
* **sketcher:** fix molecule sketcher width ([aa7fe82](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa7fe82015a69c39099a4a8b88734460bf979fa1))
* **sketcher:** fix some sketcher issues by forcing only one ketcher instance to be in use at once ([6302b1e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6302b1ec23ed97c69cad7964d86e3f648140ccad))
* **sketcher:** imrpove layout of buttons when sketcher is open ([b6a710c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b6a710cf661d0b0a4a18aae95fe4d2070815d0ac))
* **upload:** fix visual issues on dataset upload UI ([fa7c4a5](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fa7c4a556f5d308ae9e5e059cda1b7d66acd2188))
* **user:** fix html error ([880ae82](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/880ae8221f1bf5ec3a71df4e1764866c5d457c70))
* **viewers:** fix browser viewer for files at the project root ([8d9ce9b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8d9ce9b8dff780286df83904d18768c80efe6ef6))


### Performance Improvements

* **nextjs:** drop ssr to improve page load speed ([3288922](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3288922e283cb731fc88a99be7876d8975ec4783))


### Miscellaneous Chores

* release 3.0.0-rc.0 ([4118bf9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4118bf9404aa735ac1f44fed57b3d5a07934984b))
* release 3.0.0-rc.1 ([2d36d5f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2d36d5f642098f999cc44084fbc713a845541356))


### Code Refactoring

* **actions:** Update changelog.md with to remove standard-version wording ([d715b34](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d715b34b2788adbe6c42e7101c9ab1834f3c7b30))

## [3.0.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/data-manager-ui-v2.12.0...data-manager-ui-3.0.0-rc.0) (2024-03-05)


### ⚠ BREAKING CHANGES

* **actions:** Update changelog.md with to remove standard-version wording

### Features

* **api:** add a public ui-version endpoint ([5bb327a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5bb327abbba45fdbcdbfc9c7737b22a86d565f0c))
* **auth:** display auth error message in user menu ([5b295a1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5b295a106dcf615ff252da45ba72fa5fd0dfe207))
* **create-unit:** add option to create personal unit ([0df614b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0df614ba301292b5c6916c148960bfc6125195f0)), closes [#1021](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1021)
* **dataset-storage-table:** allow dataset products to be deleted from the settings window ([db3874e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/db3874ef628579f7d0194d2701bb3f65e7e99e66))
* improve sdf viewer action text and fix the maximum width of the pop-up ([4440a99](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4440a99ece3f746f6276d51611ac1be4cd46baf4))
* **project-bootstrap:** add the bstrapper to the settings dialogue and the project page ([b0f6358](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b0f6358f24c90319d942c0c333cb23e1a082176c))
* **project-bootstrap:** hide bootstrapper if the default org is hidden ([23ad5b4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/23ad5b4bfe98290851145c7a03164f1e56b263a6))
* **project-delete:** provide the project name in the delete project dialogue ([#1219](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1219)) ([2078676](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/20786768b15c683826088dc025958d84dda7354a)), closes [#1209](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1209)
* **project-page:** add option to create project directories ([6a0e1d0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6a0e1d0c0bb121dc95f6b4eebc695271c5b5a276))
* **project-page:** add option to delete directories ([6ff0226](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6ff0226f807bfda5f0f773f4b8dcfb7e50761603))
* **project-selection:** add a filter by "current user is the owner" option to org, unit and proj ([98299df](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/98299dffdc6403f04f45813629880ef333cc6f82)), closes [#1020](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1020)
* **project-selection:** add option to filter project name and owner columns ([00ddbd2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/00ddbd2d232483bf0dbbf2b0514eaa5577cc1440))
* **project-selection:** improve selection filter to give editor option ([1be8cd4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1be8cd400609ef4d85611a91bf979903ad427b1c))
* **project-selection:** set the default organisation as the default selection when no project is selected ([4fc2672](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4fc2672ea4ac828fed9c2e91d92c0385e3c88dc1))
* **project-stats:** add icon to show whether a project is private ([#1220](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1220)) ([be7f640](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/be7f6402313d12366cbd7a1d51460d7795ee094f)), closes [#1204](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1204)
* **run-job:** add test job card that only shows in development mode ([4098726](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/40987262188265575af4718437c9940fe50b32d4))
* **sdf-parser:** add first implementation of sdf filtering ([4e07937](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4e07937944fe4206d0d8442c009407d5c9a832b3))
* **sdf-viewer:** add card view property selection ([663473f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/663473f7a11168f1e02de02932c1f2df3779d431))
* **unit:** add UI to rename units ([aa8ffe9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa8ffe944b0f2551d8b6eb664a0e8ac57795a218)), closes [#1172](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1172)
* **user:** improve the look and content of the user menu ([fa8e16a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fa8e16a99f3585b8f90bc4b1890c51d0ddacd807))
* **viewers:** add SDF file viewer ([2e3e282](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2e3e282aa822841b99b2b608b9988719f7eae9ba))


### Bug Fixes

* **api:** cleanup /version API requests in the footer ([9bcdfb6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9bcdfb6be557a7c08e8bc9cdf00ef3c7ae83cc1a))
* **api:** fix admin/editor level permissions for v2 DM api ([35dd06c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/35dd06c5d0b6c49de69ea58802d495d47373d94f))
* **api:** fix breaking change caused by job variables inputs chaning from string to object ([aa53bbb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa53bbb636bbed81c83dc8eca51ff6461fceb8f7))
* **auth:** experimental test to fix 404 errors when navigating to certain pages without authentication ([327078b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/327078b69fcf93ab0f4ae697f0e0eafef86b467b))
* **auth:** final fix for 404 errors when navigating to protected pages when not loged-in ([45e6be0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/45e6be027286799b6dcfeff0c0412cb3319683c4))
* **auth:** fix auth logout issue ([6e04ce1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6e04ce15582e9ff0b717c184c0960fe226485b81))
* **auth:** fix datasets link from giving a 404 ([593e121](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/593e121a9ca0ba2d3001330b0b3cff2bd18495f2))
* **auth:** fix display of auth error messages ([ea68fc9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/ea68fc9ca088a1000b40b5e433d96f3fd11bb876))
* **auth:** fix login paths on base urls ([a3aff89](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a3aff8961ad8869fd306308076759b3470c507d8))
* **auth:** fix redirects from login ([dead1b8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/dead1b8b3772c0da5577867e347e60e37e7f2ef3))
* **authorization:** improve authorization to support evaluation role ([847e500](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/847e500f647c0664c6747f9ecf19a9ee9acad8e8))
* **context:** fix types ([f0dd662](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f0dd662e23eb7feb1f91cc5f8f72583185fb34ef))
* **create-project:** only show the button when users have permission for the selected unit ([5c82966](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5c829663c8f15f9d2cea509d01f2fb632bfe48dd))
* **create-project:** prevent private projects for the EVALUATION flavour ([3f91b14](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3f91b1493e73a17cf9545f8a34ad7a38710fad50))
* **create-unit:** move create unit actions to organisation column, fix when they're displayed and fix text ([f551659](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f5516596143b8a62a01e4549e9948d1e83c6f11b))
* **data-table:** fix search field changing sort direction ([d0761ca](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d0761ca441dcf5a9ac252a35b9f405bb6789857e))
* **dataset-sub-table:** stop showing dataset storage subscriptions when the unit doesn't have any ([dc8531a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/dc8531a24ee8fea4af50ca09564f531abcbbdc5a)), closes [#1022](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1022)
* **delete-project:** make the delete project dialogue clearer ([d330ac8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d330ac8a8b96db2ec6227f25fc63e4c1ecb0cffe))
* **deps:** pin nanoid and switch from uuid everywhere ([c087bba](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c087bba4b4e45ad527bc83d85bb3e7f0121506a7))
* **deps:** update dm client to fix data update issues ([7bee802](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/7bee8024815f1c75ef2050ca84f996882641b9cb))
* **deps:** upgrade material-ui-popup-state and fix breaking changes ([26c1bd8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/26c1bd8b0b51000cbf9d2ad708660284d1f8df50))
* disable run, rerun and delete/terminate buttons when the user isn't a project editor ([342a0af](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/342a0af3be8ee8c3d25bdaffcce4bcca2ce8a476))
* display directories without text transform ([#1162](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1162)) ([a512883](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a5128832e9a88649ac5c8aa9c55334bb6d5b3f85)), closes [#1098](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1098)
* **docs:** add space between docs nav links for a better page experience ([38c3599](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/38c35999427f30dd26a555cb69f22070e9a63f24))
* **executions:** use new molcules-smi type ([3646501](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/364650185d54ac5e8b6ab4d6ea344f4370bd6ff1))
* **file-download:** fix file download when app is hosted on a sub path ([3c95ff1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3c95ff1ceb3edc42d9f848a0732a6f8b82ea5a6e))
* fix lint issue and change default error text ([abcd1be](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/abcd1be3457e8494c60f2f6c914ca8c304d1b349))
* fix linting errors created by yup update ([c24de89](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c24de89c6bccfe0dbd021f78c7e68ef921c5d6c8))
* **instance-page:** fix terminate/delete instance texts ([858af19](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/858af193c80919770452c158c8daa75d46dc6d59))
* **job-file-inputs:** display required indicator on inputs ([ff16e12](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/ff16e123eda8a9bf9f039ddcf29a6e7c8341620f))
* **navigation:** fix button positions on mobile ([733dfcd](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/733dfcd050f63cfab14e65c905c979677c36c0c5))
* **nextjs:** fix console noise created from last commit ([0e9c6d1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0e9c6d10be0629a64ae18c8a5ff76e0907c31282))
* **nextjs:** remove console noise created by nextjs update ([f619298](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f619298b9ab1cd7bcfa52beee9a5177316b2c1ea))
* **pnpm:** update lockfile ([f0bd671](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f0bd6716e3549a8e3a6f0ab13c15e4ec23dcc69f))
* **products:** prevent evaluating users from creating dataset storage subscriptions ([cf39545](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/cf39545eae32e59291b1950e3616b5ec00140a0c))
* **project-selection:** change default filter mode to editor and fix wording ([9df5adb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9df5adbff15a6a5923a4f091e2086dc21c837a9e))
* **project-selection:** change text in owner switch ([d92cbe2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d92cbe24d5057f8eff430a073e2321229a5c8edc))
* **project-selection:** display view project button for all projects and filter out projects in magic units ([f24cfd2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f24cfd24af07fecf77edea29321c38fd92bb4b9d))
* **project-selection:** fix create personal unit action appearing incorrectly ([f2d5ba0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f2d5ba065ba6753ff19fd38bf08ef3e27c3e7200))
* **project-selection:** fix default value of owner only filter ([44ac847](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/44ac847170cc4a61022fe2db4b283e8a2ec1e58b))
* **project-selection:** fix organisation selection from behaving strange when clearing it ([99252ef](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/99252ef383c26cd05da5e3a256daa122311d53fb))
* **project-selection:** fix project filtering by unit ([1782a17](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1782a175e04bc84a55bcca34c7cbcd575950a6d0))
* **project-selection:** fix some projects not showing up in the table when the user only has project editor permissions but is not a unit member ([559365e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/559365e5a173df7d4176ccfc86fe72cc296a0df7))
* **project-selection:** fix the selected unit when permission level changes ([a1be809](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a1be8098aca50b9744b8c76b07bb253993c0f368))
* **project-selection:** fix undefined showing up in selected org ([df5766f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/df5766f215e79d767e9e70649b73d81186239b4a))
* **project-selection:** fix url and local storage state when a project doesn't exist ([64bb0df](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/64bb0df62a87a3cf8f1059437ee97a59c66c1043))
* **project-selection:** keep all applicable projects in list if user is a unit member ([de4f5ef](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/de4f5efc2a306d8d4b591201e93083bd1c3d063a))
* **results-page:** fix rerun job functionality when job uses a smiles input ([0430748](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0430748cffb29bb1580ab18fa273f220a2ea5dba))
* **results-page:** hotfix result page causing an error when no project selected ([a13fca3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a13fca309335861f760402b9b7aea570f88d6afb))
* **run-job:** disable submit button when form is not valid ([f5d07ba](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f5d07bae47156caa763e6be4da381fe9cb92e06e)), closes [#1001](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1001)
* **run-job:** display errors on invalid job inputs ([96c01cb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/96c01cb73aca8f17dd9bdcb9317a8bc63dda4ed0))
* **run-job:** enable error list at bottom of options ([938d361](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/938d3612878212abad78c20c3a44f47da0500cb0))
* **run-job:** fix run button being disabled when using rerun functionality ([1b1c192](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1b1c19297f7ada37d941fdf05a97a0c432277bff))
* **run-job:** fix validation check of inputs ([82d68d2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/82d68d2b0083c08493b317b3cfb254fcf22f40a1))
* **run-job:** improve validility state of run job button ([fde9b28](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fde9b2845e8fc221b4376de414f506c189f74920))
* **sdf-parser:** fix sdf parser when hosted on a subpath ([8a7fdbd](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8a7fdbd59ad33fc1cd883cbaec9dd9b00d0e2d35))
* **sdf-viewer:** fix display of error messages ([d0daad7](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d0daad7420edad016bef316a8ff5d298bb6e57ee))
* **sdf-viewer:** use molfile to depict molecule ([1dab054](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1dab05478a59b496d59b0b2bac691b777a2e5c22))
* **sdf:** fix card view layout at certain screen sizes ([75e7e01](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/75e7e0198308092062ef1408a5855ecd8ffc5307))
* **settings:** fix admins column and size of columns in dataset storage section ([cb7cb01](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/cb7cb01a528e7d1748b646192b9c89e934082bb4))
* **settings:** fix filter text and dropdown label in new role selector ([baa1d19](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/baa1d198336f69875a1984c3bc2f19160aae0fec))
* **sketcher:** allow empty input to be saved ([093814e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/093814ea7733078f5c5f15f07a3e5793021caa10))
* **sketcher:** capture errors and send to sentry ([2747ebb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2747ebb1a5f8040b761a7ab0c6b7d38d14f805f5))
* **sketcher:** fix molecule sketcher width ([aa7fe82](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa7fe82015a69c39099a4a8b88734460bf979fa1))
* **sketcher:** fix some sketcher issues by forcing only one ketcher instance to be in use at once ([6302b1e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6302b1ec23ed97c69cad7964d86e3f648140ccad))
* **sketcher:** imrpove layout of buttons when sketcher is open ([b6a710c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b6a710cf661d0b0a4a18aae95fe4d2070815d0ac))
* **upload:** fix visual issues on dataset upload UI ([fa7c4a5](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fa7c4a556f5d308ae9e5e059cda1b7d66acd2188))
* **user:** fix html error ([880ae82](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/880ae8221f1bf5ec3a71df4e1764866c5d457c70))
* **viewers:** fix browser viewer for files at the project root ([8d9ce9b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8d9ce9b8dff780286df83904d18768c80efe6ef6))


### Performance Improvements

* **nextjs:** drop ssr to improve page load speed ([3288922](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3288922e283cb731fc88a99be7876d8975ec4783))


### Miscellaneous Chores

* release 3.0.0-rc.0 ([4118bf9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4118bf9404aa735ac1f44fed57b3d5a07934984b))


### Code Refactoring

* **actions:** Update changelog.md with to remove standard-version wording ([d715b34](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d715b34b2788adbe6c42e7101c9ab1834f3c7b30))

## [2.12.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.12.0-rc.5...2.12.0) (2024-03-01)


### Bug Fixes

* **results-page:** hotfix result page causing an error when no project selected ([a13fca3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/a13fca309335861f760402b9b7aea570f88d6afb))

## [2.11.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.11.0-rc.0...2.11.0) (2024-02-12)

## [2.10.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.10.0-rc.0...2.10.0) (2024-02-06)

### [2.9.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.9.1-rc.0...2.9.1) (2023-12-27)

## [2.9.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.9.0-rc.2...2.9.0) (2023-12-18)

## [2.8.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.8.0-rc.2...2.8.0) (2023-12-14)

## [2.7.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.7.0-rc.5...2.7.0) (2023-11-20)

### [2.6.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.6.2-rc.1...2.6.2) (2023-08-14)

### [2.6.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.6.1-rc.0...2.6.1) (2023-07-08)


### Bug Fixes

* **docs:** add space between docs nav links for a better page experience ([38c3599](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/38c35999427f30dd26a555cb69f22070e9a63f24))

## [2.6.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.6.0-rc.6...2.6.0) (2023-06-29)


### Bug Fixes

* **create-unit:** move create unit actions to organisation column, fix when they're displayed and fix text ([f551659](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f5516596143b8a62a01e4549e9948d1e83c6f11b))
* **settings:** fix filter text and dropdown label in new role selector ([baa1d19](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/baa1d198336f69875a1984c3bc2f19160aae0fec))

## [2.5.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.5.0-rc.1...2.5.0) (2023-06-14)

## [2.5.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.5.0-rc.0...2.5.0-rc.1) (2023-06-13)


### Bug Fixes

* **create-project:** only show the button when users have permission for the selected unit ([5c82966](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5c829663c8f15f9d2cea509d01f2fb632bfe48dd))

## [2.5.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.4-rc.1...2.5.0-rc.0) (2023-06-10)


### Features

* **dataset-storage-table:** allow dataset products to be deleted from the settings window ([db3874e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/db3874ef628579f7d0194d2701bb3f65e7e99e66))


### Bug Fixes

* **create-project:** prevent private projects for the EVALUATION flavour ([3f91b14](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/3f91b1493e73a17cf9545f8a34ad7a38710fad50))
* **delete-project:** make the delete project dialogue clearer ([d330ac8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/d330ac8a8b96db2ec6227f25fc63e4c1ecb0cffe))
* **products:** prevent evaluating users from creating dataset storage subscriptions ([cf39545](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/cf39545eae32e59291b1950e3616b5ec00140a0c))

### [2.4.4-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.4-rc.0...2.4.4-rc.1) (2023-06-07)


### Bug Fixes

* **authorization:** improve authorization to support evaluation role ([847e500](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/847e500f647c0664c6747f9ecf19a9ee9acad8e8))

### [2.4.4-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.3...2.4.4-rc.0) (2023-06-02)


### Bug Fixes

* **run-job:** disable submit button when form is not valid ([f5d07ba](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f5d07bae47156caa763e6be4da381fe9cb92e06e)), closes [#1001](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1001)

### [2.4.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.3-rc.0...2.4.3) (2023-06-02)

### [2.4.3-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.2...2.4.3-rc.0) (2023-05-31)


### Bug Fixes

* **api:** fix breaking change caused by job variables inputs chaning from string to object ([aa53bbb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aa53bbb636bbed81c83dc8eca51ff6461fceb8f7))

### [2.4.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.1...2.4.2) (2023-05-25)


### Bug Fixes

* **auth:** fix datasets link from giving a 404 ([593e121](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/593e121a9ca0ba2d3001330b0b3cff2bd18495f2))

### [2.4.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.1-rc.1...2.4.1) (2023-05-25)


### Bug Fixes

* **auth:** final fix for 404 errors when navigating to protected pages when not loged-in ([45e6be0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/45e6be027286799b6dcfeff0c0412cb3319683c4))

### [2.4.1-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.1-rc.0...2.4.1-rc.1) (2023-05-24)


### Bug Fixes

* **auth:** fix redirects from login ([dead1b8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/dead1b8b3772c0da5577867e347e60e37e7f2ef3))

### [2.4.1-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.4.0...2.4.1-rc.0) (2023-05-22)


### Bug Fixes

* **auth:** experimental test to fix 404 errors when navigating to certain pages without authentication ([327078b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/327078b69fcf93ab0f4ae697f0e0eafef86b467b))

## [2.4.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.5-rc.0...2.4.0) (2023-05-22)


### Features

* **api:** add a public ui-version endpoint ([5bb327a](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5bb327abbba45fdbcdbfc9c7737b22a86d565f0c))

### [2.3.5-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.4...2.3.5-rc.0) (2023-05-13)


### Bug Fixes

* **api:** cleanup /version API requests in the footer ([9bcdfb6](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9bcdfb6be557a7c08e8bc9cdf00ef3c7ae83cc1a)), closes [#951](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/951) [#690](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/690)
* **auth:** fix auth logout issue ([6e04ce1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6e04ce15582e9ff0b717c184c0960fe226485b81))
* **deps:** upgrade material-ui-popup-state and fix breaking changes ([26c1bd8](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/26c1bd8b0b51000cbf9d2ad708660284d1f8df50))
* **nextjs:** fix console noise created from last commit ([0e9c6d1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0e9c6d10be0629a64ae18c8a5ff76e0907c31282))
* **nextjs:** remove console noise created by nextjs update ([f619298](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f619298b9ab1cd7bcfa52beee9a5177316b2c1ea))
* **viewers:** fix browser viewer for files at the project root ([8d9ce9b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8d9ce9b8dff780286df83904d18768c80efe6ef6)), closes [#953](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/953)

### [2.3.4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.4-rc.0...2.3.4) (2023-05-05)

### [2.3.4-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.3...2.3.4-rc.0) (2023-05-04)


### Bug Fixes

* **deps:** update dm client to fix data update issues ([7bee802](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/7bee8024815f1c75ef2050ca84f996882641b9cb))

### [2.3.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.3-rc.1...2.3.3) (2023-05-03)

### [2.3.3-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.3-rc.0...2.3.3-rc.1) (2023-05-03)


### Bug Fixes

* **job-file-inputs:** display required indicator on inputs ([ff16e12](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/ff16e123eda8a9bf9f039ddcf29a6e7c8341620f))
* **results-page:** fix rerun job functionality when job uses a smiles input ([0430748](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0430748cffb29bb1580ab18fa273f220a2ea5dba))

### [2.3.3-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.2...2.3.3-rc.0) (2023-04-20)


### Bug Fixes

* **executions:** use new molcules-smi type ([3646501](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/364650185d54ac5e8b6ab4d6ea344f4370bd6ff1))

### [2.3.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.1...2.3.2) (2023-03-16)


### Bug Fixes

* **deps:** pin nanoid and switch from uuid everywhere ([c087bba](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c087bba4b4e45ad527bc83d85bb3e7f0121506a7))
* fix linting errors created by yup update ([c24de89](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/c24de89c6bccfe0dbd021f78c7e68ef921c5d6c8))
* **upload:** fix visual issues on dataset upload UI ([fa7c4a5](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fa7c4a556f5d308ae9e5e059cda1b7d66acd2188))

### [2.3.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.0...2.3.1) (2023-03-14)

## [2.3.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.0-rc.4...2.3.0) (2023-03-12)

## [2.3.0-rc.4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.0-rc.3...2.3.0-rc.4) (2023-03-09)


### Bug Fixes

* **sketcher:** allow empty input to be saved ([093814e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/093814ea7733078f5c5f15f07a3e5793021caa10))

## [2.3.0-rc.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.0-rc.2...2.3.0-rc.3) (2023-03-09)


### ⚠ BREAKING CHANGES

* This requires DM API v1.1 or above

* feat!(observers): add option to edit a project's observers ([0b67d23](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0b67d234050761cd4bf7038f0ad2e057df276b04))

## [2.3.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.0-rc.1...2.3.0-rc.2) (2023-03-09)


### Bug Fixes

* **sketcher:** capture errors and send to sentry ([2747ebb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2747ebb1a5f8040b761a7ab0c6b7d38d14f805f5))

## [2.3.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.3.0-rc.0...2.3.0-rc.1) (2023-03-09)


### Bug Fixes

* **sketcher:** fix some sketcher issues by forcing only one ketcher instance to be in use at once ([6302b1e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6302b1ec23ed97c69cad7964d86e3f648140ccad))
* **sketcher:** imrpove layout of buttons when sketcher is open ([b6a710c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/b6a710cf661d0b0a4a18aae95fe4d2070815d0ac))

## [2.3.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.2.2-rc.0...2.3.0-rc.0) (2023-03-05)


### Features

* **sketcher:** add option to enter SMILEs in jobs' inputs and a sketcher to draw molecules ([2f80736](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/2f80736bc873af883653850668634a518a4dcc3a))
* **sketcher:** add sketcher smiles input component ([08d9f07](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/08d9f076907517fcbe7816e72faea865150f3afa))


### Bug Fixes

* disable run, rerun and delete/terminate buttons when the user isn't a project editor ([342a0af](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/342a0af3be8ee8c3d25bdaffcce4bcca2ce8a476))
* **instance-page:** fix terminate/delete instance texts ([858af19](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/858af193c80919770452c158c8daa75d46dc6d59))
* **navigation:** remove instanceId when navigating away from [instanceId] ([4513108](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4513108f38031c4a5b492a512e3e6730f9bf44f3))
* **project-selection:** display view project button for all projects and filter out projects in magic units ([f24cfd2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f24cfd24af07fecf77edea29321c38fd92bb4b9d))

### [2.2.2-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.2.1...2.2.2-rc.0) (2023-02-28)


### Bug Fixes

* **project-selection:** fix join of project and product info so all projects are always shown ([478dece](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/478dece78e8207657e7603f99c9c120c809f9d0d))

### [2.2.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.2.0...2.2.1) (2023-02-27)


### Bug Fixes

* **config-page:** display current env values instead of statically built values ([5afc85e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/5afc85ea0611b2a8de07cd0a2cb8b983c4eef57e))

## [2.2.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.1.3...2.2.0) (2023-02-27)


### Features

* **config-page:** Add a configuration page that displays publically available info. This is for easier debug. ([fc11664](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/fc11664c0f17fff1f212871cb1ff7c20e2a89a16))


### Bug Fixes

* **executions:** job search applies to job and description fields ([71907dd](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/71907dd049adea9cfa847cc33caa306b6334194c))

### [2.1.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.1.2...2.1.3) (2023-02-22)

### [2.1.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.1.1...2.1.2) (2023-02-22)


### Bug Fixes

* **mdx:** fix links on guided tour page ([f5fa16e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f5fa16efce7aa4067505249712094d5ee9141ad6))

### [2.1.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.1.0...2.1.1) (2023-02-22)


### Bug Fixes

* **account-menu:** change tooltip text to account to be consistent with content header ([aeb882e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/aeb882e201e989706188b55c3d3e4aae89e163a6))
* **products:** show correct header text with org and created columns ([2390045](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/23900455a2a6bcb57b6375183b31de418d79aafe))
* **project-selection:** fix storage used data ([1bf5483](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1bf548379411cdffdabd237d677e8f5824fc7808))
* **upload:** allow and file type to be uploaded to a project ([e6750df](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e6750dfad8c77354d140e42d3e1a3e69eea9eb34))

## [2.1.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.1.0-rc.2...2.1.0) (2023-02-19)

## [2.1.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.1.0-rc.1...2.1.0-rc.2) (2023-02-19)


### Features

* **result-card:** report duration of an instance ([33bfa2d](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/33bfa2d3dd0cefab1434ae3dd30f5f19466101c8)), closes [#871](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/871)

## [2.1.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.1.0-rc.0...2.1.0-rc.1) (2023-02-06)


### Bug Fixes

* **delete-unit:** fix unit deletion for units that aren't personal units ([e045c6c](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e045c6c8460f5a8ecb8fc1d20c70e7932581b3b8))

## [2.1.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.2-rc.0...2.1.0-rc.0) (2023-02-03)


### Features

* **context:** add create & edit organisation actions ([9f3e85d](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/9f3e85db83f103bcb2a571512120446bfdd5114f)), closes [#870](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/870)
* **viewers:** Replace file viewer UI & provide same options for results ([4c9d923](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4c9d923853f260dd07a39f0177ef30582d77b550)), closes [#882](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/882)


### Bug Fixes

* **delete-unit:** display toast on error ([64e44de](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/64e44de587edca0a860a2d9096369c5ddd9c66fa))
* **nextjs:** fix nextjs routes ([1ce2428](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/1ce2428c17a32b2893e7232d245c8d87e6a2299f))

### [2.0.2-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.1...2.0.2-rc.0) (2022-12-06)


### Bug Fixes

* **data-table:** hide logs in prod ([dcd3cc9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/dcd3cc9170a7bc4ff75a41a146559ea956cc8532))
* **nextjs:** delete sentry config when not using sentry (development) to suppress warning ([81b4da3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/81b4da316f8df7a88b9d9a5df28d8bac517485ce))
* **nextjs:** fix typo in config ([062c6e7](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/062c6e74dedcd99a4b8963c93c6625e61ca126b7))
* **typescript:** fix error caused by updating ts ([0976ba7](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0976ba77320ad221256a72c2a062fef6ffc1927c))

### [2.0.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.0...2.0.1) (2022-11-23)


### Bug Fixes

* **footer:** display api versions in the footer even when not logged in ([8f527f9](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/8f527f9038a5858f553c83ada031bd45c5792931))

## [2.0.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.0-rc.4...2.0.0) (2022-11-23)

## [2.0.0-rc.4](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.0-rc.3...2.0.0-rc.4) (2022-11-16)


### Features

* **charges:** add a unit charges page ([#779](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/779)) ([4a792ac](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4a792ac70c9d6c4c1d923de459c9103c46e0f9b0))


### Bug Fixes

* **charges-page:** fix billing periods calculation ([be8f6ed](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/be8f6edbb238f27bb7fe51c15c8441e1118ffc2b))
* fix base path on some links ([0b1f148](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/0b1f148771e86db505b9921528158e04ace4ae9a))

## [2.0.0-rc.3](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.0-rc.2...2.0.0-rc.3) (2022-11-03)


### Bug Fixes

* **charges-page:** fix title of product charges page ([4950f5f](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/4950f5f7f847716ac5adac334925a11fa5af1613))
* **create-dataset-sub:** fix dataset storage sub creation form ([6d2e7ae](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/6d2e7ae1cc61a76b9bf9b77716efb344ef3cc4da))
* fix browser hanging issues ([7bf43b1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/7bf43b1fa44aaadb4439bbe2d48df4008f591a2b))

## [2.0.0-rc.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.0-rc.1...2.0.0-rc.2) (2022-11-01)


### Features

* **executions:** support disabled jobs ([30baecb](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/30baecbbd38068f2f8403f94333442d7ec54c038))

## [2.0.0-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/2.0.0-rc.0...2.0.0-rc.1) (2022-11-01)


### Bug Fixes

* **context:** fix loading states in the user settings ([f383d03](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/f383d03ec1aba1881645d967a1af79daa27aebcf))
* **create-unit:** fix billing day logic when creating a unit on the first of the month ([51b4618](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/51b46187c09511d26eeb4d899f1b62b8d0f5df2e))

## [2.0.0-rc.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/1.4.0...2.0.0-rc.0) (2022-10-31)

## [1.4.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/1.3.0...1.4.0) (2022-10-31)


### Features

* **invoice:** add product invoice page ([dbe7933](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/dbe793377a78bfe3e13b4bc336869577f5e57d8b)), closes [#739](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/739)


### Bug Fixes

* **navigation:** add missing span around disabled tooltip child ([e36ba43](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/e36ba439365bf3e437301e64052dd22e71df1469))
* **project-selection:** fix issue when deleting the selected project will cause the browser to hang indefinitely ([367c20b](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/367c20b5472a364190717204c2f64db0c4d0a27b))
* **typescript:** fix a weird ts bug revealed by updating nextjs-routes ([8229091](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/82290916f9b4aa92803d187e31e0016c980c0dc4))

## [1.3.0](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/1.2.2...1.3.0) (2022-10-02)


### Features

* **products:** improve products page ([#722](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/722)) ([bc8d96e](https://github.com/InformaticsMatters/squonk2-data-manager-ui/commit/bc8d96e1494b04b5b92a8028703b57795282bf70))

### [1.2.2](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/1.2.2-rc.1...1.2.2) (2022-09-22)

### [1.2.2-rc.1](https://github.com/InformaticsMatters/squonk2-data-manager-ui/compare/1.2.2-rc.0...1.2.2-rc.1) (2022-09-21)

### [1.2.2-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/1.2.1...1.2.2-rc.0) (2022-09-21)

### [1.2.1](https://github.com/InformaticsMatters/squonk-frontend/compare/1.2.0...1.2.1) (2022-09-19)


### Bug Fixes

* **footer:** fix footer links ([bd0c576](https://github.com/InformaticsMatters/squonk-frontend/commit/bd0c576a7788b7627f53df8765940b18bf586b12))
* **instance-page:** fix unit for instance cost ([6c3833a](https://github.com/InformaticsMatters/squonk-frontend/commit/6c3833a4a544fd3e48fb09cd3f2aa9e15068b9c6))

## [1.2.0](https://github.com/InformaticsMatters/squonk-frontend/compare/1.2.0-rc.1...1.2.0) (2022-09-19)

## [1.2.0-rc.1](https://github.com/InformaticsMatters/squonk-frontend/compare/1.2.0-rc.0...1.2.0-rc.1) (2022-09-19)


### Bug Fixes

* **footer:** fix version spacing in footer ([176c268](https://github.com/InformaticsMatters/squonk-frontend/commit/176c268a4073b090a5ad5f1d7e1d8335cf5f3d2f))
* **navigation:** fix display of links on mobile ([3cbccfa](https://github.com/InformaticsMatters/squonk-frontend/commit/3cbccfab4d73b1ed8223523ff0b0a12e893518f4))

## [1.2.0-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/1.1.1...1.2.0-rc.0) (2022-09-19)


### Features

* **edit-unit:** allow user to change editors of units ([f7d3442](https://github.com/InformaticsMatters/squonk-frontend/commit/f7d34426d7248cf946042341d084f3508f7b54b2)), closes [#675](https://github.com/InformaticsMatters/squonk-frontend/issues/675)
* **instance-page:** add coins & cost to app and job details ([e35a990](https://github.com/InformaticsMatters/squonk-frontend/commit/e35a9906dfba0a0fb75e72b17aa6a9520960b6c7)), closes [#704](https://github.com/InformaticsMatters/squonk-frontend/issues/704)
* **products:** add products page a footer links ([1a82135](https://github.com/InformaticsMatters/squonk-frontend/commit/1a82135a09de75903b91b5772b81e4fd7c8287fe)), closes [#673](https://github.com/InformaticsMatters/squonk-frontend/issues/673)


### Bug Fixes

* **footer:** fix display of links on small screens ([4d75cf0](https://github.com/InformaticsMatters/squonk-frontend/commit/4d75cf0816a2aa4c60890d281c6dd07465c237b5))
* **navigation:** make mobile/tablet nav more consistent ([37a90aa](https://github.com/InformaticsMatters/squonk-frontend/commit/37a90aa7ca60636e6b0f472e41b1597726e95b94))
* **settings:** close menu popper when settings is clicked ([c8c25ba](https://github.com/InformaticsMatters/squonk-frontend/commit/c8c25badcb225c2fdbb119ac7b637e1dab1f063b))
* **settings:** move dialog to top of navbar tree so it doesn't remount when window width changes ([d4efe6a](https://github.com/InformaticsMatters/squonk-frontend/commit/d4efe6a2e12b1ca9e4cee049409636f037653f2a))

### [1.1.1](https://github.com/InformaticsMatters/squonk-frontend/compare/1.1.0...1.1.1) (2022-09-08)


### Bug Fixes

* **footer:** don't require login to see API versions ([825a650](https://github.com/InformaticsMatters/squonk-frontend/commit/825a65062b4931fa78e2717ba2512ee7db996d25))

## [1.1.0](https://github.com/InformaticsMatters/squonk-frontend/compare/1.1.0-rc.0...1.1.0) (2022-09-05)

## [1.1.0-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.1...1.1.0-rc.0) (2022-09-05)


### Features

* **archived-instances:** allow instances (jobs/apps) to be archived such that they won't be deleted automatically deleted ([94d511e](https://github.com/InformaticsMatters/squonk-frontend/commit/94d511e6d5f9be15c6ae669b751eeaa3cc156893))


### Bug Fixes

* **results-page:** fix results page when no project is selected ([96b956a](https://github.com/InformaticsMatters/squonk-frontend/commit/96b956a73eaec2b3d842f884175dc0e4b7c2bbf9))

### [1.0.1](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.1-rc.1...1.0.1) (2022-09-05)

### [1.0.1-rc.1](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.1-rc.0...1.0.1-rc.1) (2022-09-05)


### Bug Fixes

* disable some queries that run when the user isn't authenticated ([7ae63f9](https://github.com/InformaticsMatters/squonk-frontend/commit/7ae63f9ab36c2b93d7d4c77c04f162fadc6a51cb)), closes [#689](https://github.com/InformaticsMatters/squonk-frontend/issues/689)
* fix type error ([0ac3086](https://github.com/InformaticsMatters/squonk-frontend/commit/0ac308661f40e8e771c1f469fde4700bbdb361e0))
* **polling:** fix polling of tasks and instances to be more consistent ([f85ab19](https://github.com/InformaticsMatters/squonk-frontend/commit/f85ab1967502cb0a60fb32b4a20a3ac54d83d2e0))

### [1.0.1-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0...1.0.1-rc.0) (2022-08-24)


### Bug Fixes

* fix pages error ([0c3ec1c](https://github.com/InformaticsMatters/squonk-frontend/commit/0c3ec1c4b7e3c2fc58da7cf39e7dc74c205ecb26))
* **footer:** fix version clash ([c6adada](https://github.com/InformaticsMatters/squonk-frontend/commit/c6adadabeed6a982bddfbcf8b73e7d468fd8f1ce))
* **project-page:** fix ssr ([c092fd5](https://github.com/InformaticsMatters/squonk-frontend/commit/c092fd590e7d1193a18a6b08c111a7b4f0466637))
* **results-page:** fix ssr of results page ([c95a84c](https://github.com/InformaticsMatters/squonk-frontend/commit/c95a84c6f7bbe3466df708ff7d8199a1d1387268))

## [1.0.0](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.9...1.0.0) (2022-08-21)

## [1.0.0-rc.9](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.8...1.0.0-rc.9) (2022-08-21)


### Bug Fixes

* **results-page:** fix viewer links on job results ([2c6eb75](https://github.com/InformaticsMatters/squonk-frontend/commit/2c6eb75cb85bd2152eb46873aee0ca9daca62980))

## [1.0.0-rc.8](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.7...1.0.0-rc.8) (2022-08-18)


### Bug Fixes

* improve handling of project query state ([c081aad](https://github.com/InformaticsMatters/squonk-frontend/commit/c081aad7e71cce3c493d0ad086860bce353a582a))

## [1.0.0-rc.7](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.6...1.0.0-rc.7) (2022-08-17)


### Bug Fixes

* **viewers:** fix viewer opening files on subpaths ([3d923dc](https://github.com/InformaticsMatters/squonk-frontend/commit/3d923dcff664410995035790d18a758d822b4a79))

## [1.0.0-rc.6](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.5...1.0.0-rc.6) (2022-08-07)

## [1.0.0-rc.5](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.4...1.0.0-rc.5) (2022-08-02)

## [1.0.0-rc.4](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.3...1.0.0-rc.4) (2022-08-02)

## [1.0.0-rc.3](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.2...1.0.0-rc.3) (2022-08-02)


### Bug Fixes

* **viewers:** update browser viewer description ([54d91e7](https://github.com/InformaticsMatters/squonk-frontend/commit/54d91e7570bf9e0d94ebb353c17c597a30e68a8c))

## [1.0.0-rc.2](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.1...1.0.0-rc.2) (2022-08-02)


### Bug Fixes

* **viewers:** fix plain text viewer for datasets when using base path ([8faf5b8](https://github.com/InformaticsMatters/squonk-frontend/commit/8faf5b846d879806dbca98ee00da133540560f95))

## [1.0.0-rc.1](https://github.com/InformaticsMatters/squonk-frontend/compare/1.0.0-rc.0...1.0.0-rc.1) (2022-08-02)


### Bug Fixes

* **viewers:** Fix browser viewer when using a base path and plain text viewer display ([6f819ea](https://github.com/InformaticsMatters/squonk-frontend/commit/6f819ea734907a5ca697521f1e16736303181468))

## [1.0.0-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.19...1.0.0-rc.0) (2022-08-02)


### Features

* **cookie:** add cookie consent banner ([b0a355a](https://github.com/InformaticsMatters/squonk-frontend/commit/b0a355a06b821150ce654ac3c055a8bed1a554f9))
* **footer:** add link to squonk in footer ([2402a02](https://github.com/InformaticsMatters/squonk-frontend/commit/2402a029304f7d50962ad811133086f70069f601))
* **footer:** display api versions in the UI footer ([fc9c5f4](https://github.com/InformaticsMatters/squonk-frontend/commit/fc9c5f44dc179eebfb323501b1ada19e44a546b3)), closes [#658](https://github.com/InformaticsMatters/squonk-frontend/issues/658)
* **project-details:** add button to copy url of a project ([3a259a0](https://github.com/InformaticsMatters/squonk-frontend/commit/3a259a05c46023109ed0c83958b5d2b64db90883)), closes [#658](https://github.com/InformaticsMatters/squonk-frontend/issues/658)
* **share-project:** display snackbar when url is successfully copied to the clipboard ([87de082](https://github.com/InformaticsMatters/squonk-frontend/commit/87de082a8629604c5b7992f9549ddb2f07bf9251))
* **viewers:** add browser viewer option to files and datasets to view files in the browsers viewer if supported ([2e6360b](https://github.com/InformaticsMatters/squonk-frontend/commit/2e6360bf73bbfd782b639d7653f9babcaef79ad3))


### Bug Fixes

* **nextjs:** fix nextjs warning about base path ([9adf04b](https://github.com/InformaticsMatters/squonk-frontend/commit/9adf04b15ef03e1fa4c6278342c4606766c223c5))
* **project-bootstrap:** Delete product when deleting a project and wait for project task to be done ([052fe23](https://github.com/InformaticsMatters/squonk-frontend/commit/052fe2379e5bcb72b2fed8e9372dcf1265f153e4))

### [0.1.19](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.19-rc.0...0.1.19) (2022-07-25)

### [0.1.19-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.18...0.1.19-rc.0) (2022-07-25)

### [0.1.18](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.18-rc.3...0.1.18) (2022-07-21)

### [0.1.18-rc.3](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.18-rc.2...0.1.18-rc.3) (2022-07-21)

### [0.1.18-rc.2](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.18-rc.1...0.1.18-rc.2) (2022-07-19)


### Bug Fixes

* **project-bootstrap:** Don't display project bootstrap if a project is selected ([578e55e](https://github.com/InformaticsMatters/squonk-frontend/commit/578e55eee624cf282c5c09a99099e7a166d8b7d9)), closes [#652](https://github.com/InformaticsMatters/squonk-frontend/issues/652)

### [0.1.18-rc.1](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.18-rc.0...0.1.18-rc.1) (2022-07-16)

### [0.1.18-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.17...0.1.18-rc.0) (2022-07-16)


### Features

* **result-timeline:** Display colour and tooltip for the event type and provide toggle to filter out debug events ([55c444c](https://github.com/InformaticsMatters/squonk-frontend/commit/55c444c2bcba0547387bc86c2ff4b72013864d70))
* **settings:** Add icons for org and unit selection to show private and membership ([553f23c](https://github.com/InformaticsMatters/squonk-frontend/commit/553f23cd3d6c86f97676113c744db317298c4d87))

### [0.1.17](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.17-rc.0...0.1.17) (2022-07-12)

### [0.1.17-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.16...0.1.17-rc.0) (2022-07-12)


### Bug Fixes

* **create-project:** Change default value for private projects to true ([e295ab6](https://github.com/InformaticsMatters/squonk-frontend/commit/e295ab66407c489f5cafccdce22089679ae43bbe))
* **create-unit:** Prevent users from creating units in the default org ([5edfdbd](https://github.com/InformaticsMatters/squonk-frontend/commit/5edfdbdf3d6b2afc6d2d61b77d75c2690d04e754)), closes [#633](https://github.com/InformaticsMatters/squonk-frontend/issues/633)
* **nextjs:** Fix types from next 12 ([b689053](https://github.com/InformaticsMatters/squonk-frontend/commit/b68905379c2c9c8275c01031940902ef75650f53))
* **theme:** Fix loading of dark mode when it's set in local storage ([d4d307c](https://github.com/InformaticsMatters/squonk-frontend/commit/d4d307cd8e235f7cfeaa2663cd77d56348ce91a8))
* **user:** Clear local storage when user logs out ([47171b9](https://github.com/InformaticsMatters/squonk-frontend/commit/47171b9bb15e00b5ad22aaa7e33f17b5728ab1ef))

### [0.1.16](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.16-rc.2...0.1.16) (2022-07-04)

### [0.1.16-rc.2](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.16-rc.1...0.1.16-rc.2) (2022-07-04)


### Bug Fixes

* **create-unit:** Allow units to be created when only a org is selected ([efac5a8](https://github.com/InformaticsMatters/squonk-frontend/commit/efac5a856e006cbb4eb581990408bef3efb3bb70))
* **typescript:** Fix nextjs types ([45cba71](https://github.com/InformaticsMatters/squonk-frontend/commit/45cba7117823d261461d1699fdc54d80405421a8))

### [0.1.16-rc.1](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.16-rc.0...0.1.16-rc.1) (2022-07-02)


### Bug Fixes

* **project-selection:** Fix column widths and headers ([8edab17](https://github.com/InformaticsMatters/squonk-frontend/commit/8edab179380e4150be21c0a570948a1ec3c46839))
* **select-organisation:** Show all organisations, not just those with units ([57cd060](https://github.com/InformaticsMatters/squonk-frontend/commit/57cd060a9ed55837ed2189434549651758ecbca0))

### [0.1.16-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.15...0.1.16-rc.0) (2022-07-02)


### Features

* **project-selection:** Add owner to settings project/product table ([5e9e978](https://github.com/InformaticsMatters/squonk-frontend/commit/5e9e978bd2b9219f4c6355837a56cf884929be2c))
* **sentry:** Report "unknonw errors" to Sentry ([6759da3](https://github.com/InformaticsMatters/squonk-frontend/commit/6759da3610e5f9bc629347cfbb5a1408f19afa65))


### Bug Fixes

* **create-project:** Fix service id temporarily ([be2d8a8](https://github.com/InformaticsMatters/squonk-frontend/commit/be2d8a8c185a9df5adc929c64c1d726cbfde4199))
* **create-unit:** Allow org members to create units ([282985f](https://github.com/InformaticsMatters/squonk-frontend/commit/282985f96729494f34b0c9dbb24f6eba7c1c7062))
* Make UI compatible with breaking changes in squonk APIs ([6a76185](https://github.com/InformaticsMatters/squonk-frontend/commit/6a761853bf78e2b34e60c8965e7d7408e6c07900))

### [0.1.15](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.15-rc.0...0.1.15) (2022-06-17)

### [0.1.15-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.14...0.1.15-rc.0) (2022-06-17)


### Bug Fixes

* **jobs-page:** Fix rerun job button not using changes to inputs ([6442cd8](https://github.com/InformaticsMatters/squonk-frontend/commit/6442cd88a423f2ea1ce1c6852996381b84a037cd)), closes [#601](https://github.com/InformaticsMatters/squonk-frontend/issues/601)

### [0.1.14](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.14-rc.0...0.1.14) (2022-06-16)

### [0.1.14-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.13...0.1.14-rc.0) (2022-06-16)


### Bug Fixes

* **dataset-storage-table:** Adjust columns in dataset storage table in the settings UI ([725f97e](https://github.com/InformaticsMatters/squonk-frontend/commit/725f97e8b114fbba681040b202ab78a6476d7e7e)), closes [#596](https://github.com/InformaticsMatters/squonk-frontend/issues/596)
* **result-timeline:** Improve display of results timeline ([c2243fb](https://github.com/InformaticsMatters/squonk-frontend/commit/c2243fb4ceeb8e28158b3125b66147a43cc9e827))
* **settings:** Fix position of user menu popper ([1f836ae](https://github.com/InformaticsMatters/squonk-frontend/commit/1f836ae981ed291e18a37443a00455495c4e86b0))

### [0.1.13](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.13-rc.0...0.1.13) (2022-06-15)

### [0.1.13-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.12...0.1.13-rc.0) (2022-06-15)


### Bug Fixes

* **settings:** Change settings popper so it doesn't block the rest of the UI ([cb3bc0f](https://github.com/InformaticsMatters/squonk-frontend/commit/cb3bc0fb5a67ae3f713e521e5df399aff87e3ddf))

### [0.1.12](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.12-rc.0...0.1.12) (2022-06-13)

### [0.1.12-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.11...0.1.12-rc.0) (2022-06-13)


### Bug Fixes

* **results-page:** Fix display of nextflow events ([4e3d2be](https://github.com/InformaticsMatters/squonk-frontend/commit/4e3d2bef811dd6f213b41c3e482b52e9944ca08f)), closes [#576](https://github.com/InformaticsMatters/squonk-frontend/issues/576)

### [0.1.11](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.11-rc.0...0.1.11) (2022-05-31)

### [0.1.11-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.10...0.1.11-rc.0) (2022-05-31)


### Features

* **file-download:** Allow all types of files to be downloaded from the project page ([ffba58e](https://github.com/InformaticsMatters/squonk-frontend/commit/ffba58e9e4353f176ed6f4ea93a70238da888dc3))


### Bug Fixes

* **delete-files:** Disable delete file buttons when user isn't a project editor ([5f9f284](https://github.com/InformaticsMatters/squonk-frontend/commit/5f9f284c011db2c19c5274a12f9de01450412119))
* **upload:** Disable project file-upload button when user isn't a project editor or owner ([a5925f2](https://github.com/InformaticsMatters/squonk-frontend/commit/a5925f27285723bc606ec91fcef786479e9c1b9f))

### [0.1.10](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.10-rc.0...0.1.10) (2022-05-30)

### [0.1.10-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.9...0.1.10-rc.0) (2022-05-30)

### [0.1.9](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.9-rc.0...0.1.9) (2022-05-30)

### [0.1.9-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.8...0.1.9-rc.0) (2022-05-30)


### Bug Fixes

* **results-page:** Fix links to output files ([0146470](https://github.com/InformaticsMatters/squonk-frontend/commit/01464708354515f5d8a4a266e2abc5e26d2e31d7))

### [0.1.8](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.8-rc.0...0.1.8) (2022-05-29)

### [0.1.8-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.7...0.1.8-rc.0) (2022-05-29)


### Bug Fixes

* **plaintext-viewer:** Fix display of content in plaintext viewer ([66c4fd8](https://github.com/InformaticsMatters/squonk-frontend/commit/66c4fd83cd7f4d48ca30d94ec30da6bbb73243df))
* **plaintext-viewer:** Fix query parameters in file page ([75d454a](https://github.com/InformaticsMatters/squonk-frontend/commit/75d454acd33274df09ea46da039eea035c2bcce1))

### [0.1.7](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.6...0.1.7) (2022-05-28)


### Features

* **nextjs:** Add nicer transitions between routes ([08a6f0d](https://github.com/InformaticsMatters/squonk-frontend/commit/08a6f0da740312d5fd47a9f045392480b45e086f))

### [0.1.6](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.5...0.1.6) (2022-05-28)


### Features

* **file-download:** Allow user to download managed files on the project page ([0bf2a37](https://github.com/InformaticsMatters/squonk-frontend/commit/0bf2a373883930f444b1f110b4c746e5aadcf5d9)), closes [#312](https://github.com/InformaticsMatters/squonk-frontend/issues/312)


### Bug Fixes

* **layout:** Place footer at bottom of screen when content height is small ([0c5450d](https://github.com/InformaticsMatters/squonk-frontend/commit/0c5450dfe6b9af9f937cd800a90ca12fd7bc8e12))

### [0.1.5](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.4...0.1.5) (2022-05-27)


### Bug Fixes

* **executions:** Fix typo in warning text when no project is selected ([7f7eda3](https://github.com/InformaticsMatters/squonk-frontend/commit/7f7eda3f4138aa48bc7e6532fc1c0970162876dd))

### [0.1.4](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3...0.1.4) (2022-05-26)


### Features

* **executions:** Add warning when no project is selected ([899637f](https://github.com/InformaticsMatters/squonk-frontend/commit/899637f772b25daf36fd0a0893e19f48121b4acb))
* **project-stats:** Reorder project stats table and add clear selected project button ([d1f54b3](https://github.com/InformaticsMatters/squonk-frontend/commit/d1f54b32d3464e02acd2ac49d81b323fa0f62a2e))


### Bug Fixes

* **jobs:** Fix job launching (use correct app version) ([640e202](https://github.com/InformaticsMatters/squonk-frontend/commit/640e2022939c0b1cbff72314d57c9c519df4dd84))

### [0.1.3](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.10...0.1.3) (2022-05-26)

### [0.1.3-rc.10](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.9...0.1.3-rc.10) (2022-05-26)

### [0.1.3-rc.9](https://github.com/InformaticsMatters/mini-apps-data-tier-ui/compare/0.1.3-rc.8...0.1.3-rc.9) (2022-05-24)

### [0.1.3-rc.8](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.7...0.1.3-rc.8) (2022-05-20)


### Features

* **instance:** Expose debug when running Jobs/Apps ([17afae1](https://github.com/InformaticsMatters/squonk-frontend/commit/17afae1a407cc4e4d64a4e42c4bf43557f4aa442)), closes [#475](https://github.com/InformaticsMatters/squonk-frontend/issues/475)

### [0.1.3-rc.7](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.6...0.1.3-rc.7) (2022-05-13)

### [0.1.3-rc.6](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.5...0.1.3-rc.6) (2022-05-04)

### [0.1.3-rc.5](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.4...0.1.3-rc.5) (2022-04-28)


### Features

* **edit-project:** Add switch to toggle whether a project is public or private ([6d66a18](https://github.com/InformaticsMatters/squonk-frontend/commit/6d66a1894753d95f822afeba92e6268483acf1d8))

### [0.1.3-rc.4](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.3...0.1.3-rc.4) (2022-04-28)


### Features

* **create-project:** Provide option to create private projects ([63449f5](https://github.com/InformaticsMatters/squonk-frontend/commit/63449f5350da39a335ca96a41a2f0e7564eacae2))


### Bug Fixes

* Fix broken build ([c938d35](https://github.com/InformaticsMatters/squonk-frontend/commit/c938d351f0a0dfcaeab716b93e59260d051a7f0f))

### [0.1.3-rc.3](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.2...0.1.3-rc.3) (2022-04-28)

### [0.1.3-rc.2](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.1...0.1.3-rc.2) (2022-04-27)


### Bug Fixes

* **deps:** update dependency dayjs to v1.11.1 ([e18cb85](https://github.com/InformaticsMatters/squonk-frontend/commit/e18cb850c48f28405d96890acb4d4c385515e1d2))
* **deps:** update dependency react-query to v3.38.0 ([54d697d](https://github.com/InformaticsMatters/squonk-frontend/commit/54d697deb537ac94be2fad4fd567eef16e0cb41a))
* **deps:** update material-ui monorepo ([3d6108c](https://github.com/InformaticsMatters/squonk-frontend/commit/3d6108c7a7e7f317e7e24b04b18dc243f6ce92b1))
* **executions-cards:** Make disabled status of run buttons of execution cards consistent ([08d2305](https://github.com/InformaticsMatters/squonk-frontend/commit/08d2305b42b46228775b2a11a58e2911742dda9f)), closes [#499](https://github.com/InformaticsMatters/squonk-frontend/issues/499)
* **project-selection:** Fix project not being deselected from local storage when no project is selected ([74f9372](https://github.com/InformaticsMatters/squonk-frontend/commit/74f9372d2dfdd160857ab47673549820e7b1e109))

### [0.1.3-rc.1](https://github.com/InformaticsMatters/squonk-frontend/compare/0.1.3-rc.0...0.1.3-rc.1) (2022-04-19)


### Features

* **project:** Persist project selection betwen sessions ([2acda31](https://github.com/InformaticsMatters/squonk-frontend/commit/2acda317eb02c2431e895c2ec0e0500150e2e495))


### Bug Fixes

* **deps:** update dependency @emotion/react to v11.9.0 ([d1620a9](https://github.com/InformaticsMatters/squonk-frontend/commit/d1620a9002564bc0ddc42071a2227c2a7d054914))
* **deps:** update dependency react-dropzone to v12.0.5 ([22a598b](https://github.com/InformaticsMatters/squonk-frontend/commit/22a598be8036132b2ac35e64b2e32e07f1f2080e))
* **deps:** update dependency use-immer to v0.7.0 ([adda0fd](https://github.com/InformaticsMatters/squonk-frontend/commit/adda0fd58301d2d3a02e76f065008e98968f6f11))

### [0.1.3-rc.0](https://github.com/InformaticsMatters/squonk-frontend/compare/v0.1.2...v0.1.3-rc.0) (2022-04-14)


### Features

* Prevent the user from accessing the executions and project pages when the user is not an editor or owner ([b3ac115](https://github.com/InformaticsMatters/squonk-frontend/commit/b3ac1153ebe7fda029b479749736ed0e37dbcfa3))


### Bug Fixes

* **oup-context:** Fix display of bootstrap when user deletes personal unit ([41c6175](https://github.com/InformaticsMatters/squonk-frontend/commit/41c6175cf5fa96a630987dc0ed87612a5857660b)), closes [#477](https://github.com/InformaticsMatters/squonk-frontend/issues/477)

### [0.1.2](https://github.com/InformaticsMatters/squonk-frontend/compare/v0.1.2-rc.1...v0.1.2) (2022-04-13)


### Bug Fixes

* **deps:** pin dependency @mdx-js/loader to 2.1.1 ([fdb89ef](https://github.com/InformaticsMatters/squonk-frontend/commit/fdb89ef0e9a70061c77ea83ae6dfe4fd4f252049))

### [0.1.2-rc.1](https://github.com/InformaticsMatters/squonk-frontend/compare/v0.1.2-rc.0...v0.1.2-rc.1) (2022-04-02)

### 0.1.2-rc.0 (2022-04-01)


### Features

* :alembic: test whether we can allow multiple file uploads with a simple prop change ([2ad437f](https://github.com/InformaticsMatters/squonk-frontend/commit/2ad437f02630e5c4963d9583eb2e142a7fb6de60))
* :bento: replace default title, meta and manifest info in public dir ([9dc5ac8](https://github.com/InformaticsMatters/squonk-frontend/commit/9dc5ac827fcf99e7964b53054a620cd0ed70143b))
* :lipstick: add checkbox to the options popup & improve keyboard interaction ([b42b8be](https://github.com/InformaticsMatters/squonk-frontend/commit/b42b8bedb726ec4a20dc9d8b2f0fa067b8c0dffb))
* :lipstick: add font weight to distinguish an add new label option from others ([727f37d](https://github.com/InformaticsMatters/squonk-frontend/commit/727f37d0737414d7014fd9e1cf959a46f6fa14e1))
* Add option to select project entitlement when creating a project ([85344cb](https://github.com/InformaticsMatters/squonk-frontend/commit/85344cb56578340f5bf5ce7bb0aa617e47444905))
* **add-project:** Remove entitlements ([29910b1](https://github.com/InformaticsMatters/squonk-frontend/commit/29910b15dc3dcfc1718392f2f941ebb987799144))
* **api:** Add temporary AS values to various API calls ([d6376ad](https://github.com/InformaticsMatters/squonk-frontend/commit/d6376adfa0e2dbdac26fa7f7aa008feec86773b4))
* **api:** Limit the size of the response returned from API file endpoint ([1bd8e15](https://github.com/InformaticsMatters/squonk-frontend/commit/1bd8e15e95c734258cbe0bb68b35f4932ed5345d))
* **api:** Update api client to 0.4 ([8c96c30](https://github.com/InformaticsMatters/squonk-frontend/commit/8c96c30a6b419f716230b86ae5fd8792b3917d05))
* **appearance:** Update to theme 0.6.0 which changes some input defaults ([54d8dcf](https://github.com/InformaticsMatters/squonk-frontend/commit/54d8dcf7c9e7c81cc8274ab76533cca48ce25aba)), closes [#10](https://github.com/InformaticsMatters/squonk-frontend/issues/10)
* **auth:** :sparkles: Add proxy api route to authenticate API requests and change to using a a custom auth instance to enable config.json loading ([cb6ba2f](https://github.com/InformaticsMatters/squonk-frontend/commit/cb6ba2fdb29ffd64bcb0d0afddbf8d9e681fe5ec))
* **Authorization:** Display warning on home page if the user isn't authorized ([93625ae](https://github.com/InformaticsMatters/squonk-frontend/commit/93625ae33f873a193e1547060da7a2336078d4e3))
* **Authorization:** Require a role to access protected routes ([2a9ada1](https://github.com/InformaticsMatters/squonk-frontend/commit/2a9ada1c005f5d2a026e185d841e7e7f8e1c3fc4))
* **color-scheme:** Add a dark mode toggle persisted by localStorage ([8d9e014](https://github.com/InformaticsMatters/squonk-frontend/commit/8d9e014023de381ed23de9f1207f1a2d2f415b5b))
* **data-details:** Add Version Information ([868ce65](https://github.com/InformaticsMatters/squonk-frontend/commit/868ce65ee64337c148ae9ee113e349833cd41941))
* **dataset-actions:** Reorganise the datasets detail view ([556acc7](https://github.com/InformaticsMatters/squonk-frontend/commit/556acc781688067d7969dc146017494b6e54ff61))
* **dataset-details:** Add file size information ([6fb432f](https://github.com/InformaticsMatters/squonk-frontend/commit/6fb432f9c082f6dff53f0a17f6afb8fa39bc32c4))
* **dataset-details:** Add project names a dataset is attached to ([9110c76](https://github.com/InformaticsMatters/squonk-frontend/commit/9110c76e9949584725d4b0c0c113d7c026ab5c9d))
* **dataset-details:** Invalidate datasets upon dataset version attachment ([191ff3a](https://github.com/InformaticsMatters/squonk-frontend/commit/191ff3a6ba936ac8309c6ba9623205f2ae043e54))
* **dataset-editors:** Display owner in italics in editors list in the table ([d492876](https://github.com/InformaticsMatters/squonk-frontend/commit/d492876093e3c60b42b29401932eadc94fce61d6))
* **dataset-new-version:** Add dataset action that allows the upload of a new version ([d93236b](https://github.com/InformaticsMatters/squonk-frontend/commit/d93236b1b4c4f22ab76544793b1f9ea50a56c3e2))
* **dataset-new-version:** Add type specific options from the main file uploader to the new version uploader ([4723f43](https://github.com/InformaticsMatters/squonk-frontend/commit/4723f43854fbcec7f998b7fdaa5f844487ba5103))
* **dataset-schema:** Add ability to change description of a dataset ([85bc354](https://github.com/InformaticsMatters/squonk-frontend/commit/85bc3542ef94e6b0d25cf7652a512c288458a509))
* **dataset-schema:** Add ability to edit description ([bddfbbe](https://github.com/InformaticsMatters/squonk-frontend/commit/bddfbbe917474cd0a95db910d7ba87b149218318))
* **dataset-schema:** Add ability to edit type ([86eaa53](https://github.com/InformaticsMatters/squonk-frontend/commit/86eaa53a780ffe2b815ec4c2d30fb8b9001a9101))
* **dataset-schema:** Add labels to revert buttons in schema view ([61cb61e](https://github.com/InformaticsMatters/squonk-frontend/commit/61cb61e4bb5b11455afc40dd55e58bb33fc2fe35))
* **dataset-schema:** Add view to the schema for a dataset inside the dataset details ([79980aa](https://github.com/InformaticsMatters/squonk-frontend/commit/79980aa7c0d2bc573ec0a39025ce1a6ed2421d67))
* **dataset-schema:** Display fields of schema as a sortable table ([72ab34a](https://github.com/InformaticsMatters/squonk-frontend/commit/72ab34a2c2347cf8903717b4f6d3dd99b4aab3aa))
* **dataset-schema:** Save changed dataset schema data ([f253d56](https://github.com/InformaticsMatters/squonk-frontend/commit/f253d560411e9b056d8a2ca2cbf3027e62725e37))
* **datasets:** Add filters to the datasets table ([efb7fc0](https://github.com/InformaticsMatters/squonk-frontend/commit/efb7fc0a4272607e8a47b7b0315b614d67b1dac3))
* **delete-dataset:** Add versions options to a dialog that opens when deleting a dataset ([b61d3c2](https://github.com/InformaticsMatters/squonk-frontend/commit/b61d3c2377ba295aa5521b64a29acf616d2be79b))
* **delete-dataset:** All versions are selected by default ([de9db54](https://github.com/InformaticsMatters/squonk-frontend/commit/de9db54d5ca55559a4bf2ef7787291b378ef9098))
* **delete-dataset:** Display published date/time in the selection labels ([ccb16c2](https://github.com/InformaticsMatters/squonk-frontend/commit/ccb16c22855618cce9d8dab3e549f65678f5eb9c))
* **delete-dataset:** Update texts ([0d66108](https://github.com/InformaticsMatters/squonk-frontend/commit/0d66108e88521788e6b734a1e730484e5138cc92))
* **detach-file:** Add warning and confirmation when the user tries to detach a file ([7d70db3](https://github.com/InformaticsMatters/squonk-frontend/commit/7d70db3d44dc922d6220ca9c3e10c4298201d83d))
* Display project names in Project Stats ([#340](https://github.com/InformaticsMatters/squonk-frontend/issues/340)) ([6062e99](https://github.com/InformaticsMatters/squonk-frontend/commit/6062e99597eb67ca2c0ce9972a776ca1e0e2a13f))
* **download-dataset:** Add ability to download versions of datasets ([b5bc2fd](https://github.com/InformaticsMatters/squonk-frontend/commit/b5bc2fd26c985828582941bebedd5c1e48d3754b))
* **edit-project:** Add tooltip to edit project nav button ([3eb108e](https://github.com/InformaticsMatters/squonk-frontend/commit/3eb108e497944b0b76f534ed3bf610e7fb20e6b9))
* **editor:** Consume editors endpoint when editing project editors & switch to combobox component ([19cccdb](https://github.com/InformaticsMatters/squonk-frontend/commit/19cccdbba955ae91fd248cf40dcd84fc889965f6))
* **env-vars:** Update auth0 code to consume env variables ([d1c492f](https://github.com/InformaticsMatters/squonk-frontend/commit/d1c492f5c1d178c7a856a87b28d18442d822a643))
* **executions-cards:** Add a color to keyword component in job cards ([cb6ac2f](https://github.com/InformaticsMatters/squonk-frontend/commit/cb6ac2ff6118c4c7164142047cd078ca96440248))
* **executions-cards:** Add application specification to application card modals ([2adb5c6](https://github.com/InformaticsMatters/squonk-frontend/commit/2adb5c6e551615e4d9f9b9731a8baa328df28eba))
* **executions-cards:** Add colours to card avatars ([464e7d5](https://github.com/InformaticsMatters/squonk-frontend/commit/464e7d566c28eb174ab8acd5dd551138c5012fb3))
* **executions-cards:** Add job description to cards ([8373959](https://github.com/InformaticsMatters/squonk-frontend/commit/8373959eb4d10dd94a268127512a0d17cddfb14f))
* **executions-cards:** Add matching to job name and catagory to the app/job card search ([b72f3b7](https://github.com/InformaticsMatters/squonk-frontend/commit/b72f3b7a4f1a830d8b5832d612c60b3d4b642272))
* **executions-cards:** Add option to filter execution cards by application or job ([1fc84ea](https://github.com/InformaticsMatters/squonk-frontend/commit/1fc84ea4e5dfa8daa3b99665eb5715ea9fea0042))
* **executions-cards:** Add option to search by job keywords ([690d8f2](https://github.com/InformaticsMatters/squonk-frontend/commit/690d8f276cce0e482bb1733e277dd8354f25f450))
* **executions-cards:** Add option to search the executions cards by title ([3a4c10f](https://github.com/InformaticsMatters/squonk-frontend/commit/3a4c10f2e21e975ece6b46299a71126aa5f5a557))
* **executions-cards:** Create base card component to share basic functionality of jobs and apps ([8b9e419](https://github.com/InformaticsMatters/squonk-frontend/commit/8b9e419ea21553241c935ef4465f467f3484a6c3))
* **executions-cards:** Improve progress and status of tasks in the job and app cards ([979d100](https://github.com/InformaticsMatters/squonk-frontend/commit/979d1004e3ceb6669c867ff971b2f90ddb9eed1c))
* **executions-cards:** Make applications launch in the same way as jobs ([896677b](https://github.com/InformaticsMatters/squonk-frontend/commit/896677bf38f7ee69917a1720b13b54fa5ff593c7))
* **executions-cards:** Make job chips smaller ([be551d8](https://github.com/InformaticsMatters/squonk-frontend/commit/be551d8484c20fc562e18616ce100dc784b320b9))
* **executions-cards:** Remove card header text "run <>" ([cc327cb](https://github.com/InformaticsMatters/squonk-frontend/commit/cc327cb27fd7cafa42d3ca6b1d4e34d9e4cf84e4))
* **executions-cards:** Tidy up cards using a new BaseCard component. Allow termination of jobs instances. ([e0bf043](https://github.com/InformaticsMatters/squonk-frontend/commit/e0bf0434347418879cbaee41dc1e2746848c3eb3))
* **executions:** Automatically open lists of instances on jobs when one is run ([e62e1b9](https://github.com/InformaticsMatters/squonk-frontend/commit/e62e1b94204b6ad434eec93199aee3980fa660db))
* **experimentation:** :poop: Add basic form to test file uploads (post requests) ([c658fdb](https://github.com/InformaticsMatters/squonk-frontend/commit/c658fdba364582f8f50cc7a2cbc59dd46e27aa2e))
* **file-to-dataset:** Allow the user to crete new datasets from files in a project ([abcf107](https://github.com/InformaticsMatters/squonk-frontend/commit/abcf107bb6dbf2e09271b3aad631f9027578c7e8))
* **fonts:** :sparkles: Add open sans and raleway font imports and add Mui Theme providers ([1f8fb02](https://github.com/InformaticsMatters/squonk-frontend/commit/1f8fb02ae6f69c033941eb4768ec00953dc8718d))
* **footer:** Add a footer ([d07ba2e](https://github.com/InformaticsMatters/squonk-frontend/commit/d07ba2e086ee6cdb69d2badf1a00b6c2564ebe99))
* **head:** Add title tags to each page ([053fc86](https://github.com/InformaticsMatters/squonk-frontend/commit/053fc86dcf5be5ccff0e10208ba4886803469aaf))
* **job-file-inputs:** Add collapse animation when toggling visibility of file selector ([f43838e](https://github.com/InformaticsMatters/squonk-frontend/commit/f43838ecde33db3dfe7ab27f4403a72476529702))
* **job-file-inputs:** Add more info to the selection summary text ([2b971f1](https://github.com/InformaticsMatters/squonk-frontend/commit/2b971f1989ef1c1273bc46ece197ff312babe7e3))
* **job-file-inputs:** Improve the file selector with a optional project view ([f8ea8d3](https://github.com/InformaticsMatters/squonk-frontend/commit/f8ea8d3d802e0343caa87b893c3928e3cc77aa57))
* **job-file-inputs:** Invert short list toggle button ([62b9b14](https://github.com/InformaticsMatters/squonk-frontend/commit/62b9b14d5e6539640129aed70735093734316461))
* **jobs-logs:** Add button to go to output directory ([8fb867e](https://github.com/InformaticsMatters/squonk-frontend/commit/8fb867ed1334de46a5868c14670cdfb352a1af24))
* **jobs:** Add collection to job cards ([84cec9c](https://github.com/InformaticsMatters/squonk-frontend/commit/84cec9cf6e7a12ec7308ad29329bd4db83e77936))
* **jobs:** Add link to job documentation ([10b86ea](https://github.com/InformaticsMatters/squonk-frontend/commit/10b86eafa345a87120abaa6aa2fa70f90dd3333c)), closes [#265](https://github.com/InformaticsMatters/squonk-frontend/issues/265)
* **jobs:** Connect selected files together and job options to jobs can be run ([1e19b45](https://github.com/InformaticsMatters/squonk-frontend/commit/1e19b4505bb53d7c13843e3e3688ba451116da9f))
* **jobs:** Provide a default instance name when running a job ([014ca7b](https://github.com/InformaticsMatters/squonk-frontend/commit/014ca7b6ba2d4be8ff8de1bd8c8aa9686931102a))
* **jobs:** Provide option to set job name ([2fdb06e](https://github.com/InformaticsMatters/squonk-frontend/commit/2fdb06e2ad98ab412068059d4f546b5c0eaa4574))
* **jobs:** Sort instances list by launched time ([cb068c6](https://github.com/InformaticsMatters/squonk-frontend/commit/cb068c68a2974ae07da879629bd4b4e00cbd38b2))
* **labels:** Add options to add labels to datasets and manage dataset editors ([72c5506](https://github.com/InformaticsMatters/squonk-frontend/commit/72c5506aadb7b821310d6c7d9a20320088b9414a))
* **labels:** Display a merged view of labels in the table ([3631a8b](https://github.com/InformaticsMatters/squonk-frontend/commit/3631a8b126b0f6d7e2e2c4895ad020e27054fe62))
* **labels:** Display dataset labels in the table ([d9290bd](https://github.com/InformaticsMatters/squonk-frontend/commit/d9290bdbcdb0cee62f7b589d9302320a4afb9d1e))
* **mdx:** Transform mdx content with MUI components to improve home page appearance ([9f4da48](https://github.com/InformaticsMatters/squonk-frontend/commit/9f4da48a07544becb99d9c0a707396d8b641cfe4))
* **nextjs:** Add a unauthenticated test page ([ae92704](https://github.com/InformaticsMatters/squonk-frontend/commit/ae9270441c0ac08cd37d12387e464c51d52a8626))
* **nextjs:** Add support for mdx pages ([2806c4a](https://github.com/InformaticsMatters/squonk-frontend/commit/2806c4a0535c19c1330cb26d188631362217d375))
* **nextjs:** Make the max upload size (on the api proxy) configurable with an env var ([5a2226a](https://github.com/InformaticsMatters/squonk-frontend/commit/5a2226af5367483c1a805964c19245b6781fbd3c))
* **org-unit-project:** Allow selection of org and unit in addition to project ([1dbc492](https://github.com/InformaticsMatters/squonk-frontend/commit/1dbc492c933019baaf99e03999066d9e86607075))
* **orval:** Update dm client and fix issues created with this update ([cb93703](https://github.com/InformaticsMatters/squonk-frontend/commit/cb937031d35f625e6e0891d0ddc69bf04c9dcd13))
* **pages:** Separate data and project pages into separate pages ([c9a5b73](https://github.com/InformaticsMatters/squonk-frontend/commit/c9a5b73168c618fa435bdd3df794a4d5898bc405)), closes [#393](https://github.com/InformaticsMatters/squonk-frontend/issues/393)
* **project-details:** Display file contents ([25bc4ac](https://github.com/InformaticsMatters/squonk-frontend/commit/25bc4ac99af61f3b31dcaf29be1c3a099417a6aa))
* **project-details:** Use Fira Mono for pre font-family ([c04b3f4](https://github.com/InformaticsMatters/squonk-frontend/commit/c04b3f4c6c4885dd598ca9ceab32b6bc118fb5b9))
* **project-page:** Add option to select unit, org and project from project page ([fa24d66](https://github.com/InformaticsMatters/squonk-frontend/commit/fa24d666267eef53ea7b8e3cb430641e733bee70))
* **project-state:** Preserve project state between tabs and allow a "double" on data to remove selected project ([6d8b476](https://github.com/InformaticsMatters/squonk-frontend/commit/6d8b4767c7382b8b3bded971443c4decd2718791))
* **project-state:** Use query parameter to store the selected project allowing links to projects ([e520f7b](https://github.com/InformaticsMatters/squonk-frontend/commit/e520f7bcf3c9ebbd313e76401a0fa8b744437e7c))
* **proxy:** Allow disabling of the certificate check ([90f0416](https://github.com/InformaticsMatters/squonk-frontend/commit/90f04164eaf061d2626481908e919038812fba42))
* **roles:** Display a better error message when the user is missing required roles ([39b7762](https://github.com/InformaticsMatters/squonk-frontend/commit/39b77621f0007e690c10988812b02460dda3132a))
* **tasks:** Add a nicer display of job info ([a0a295c](https://github.com/InformaticsMatters/squonk-frontend/commit/a0a295cfcef9772651b62fe87fa83de6df35ed0b))
* **tasks:** Add basic view of available tasks on the tasks page ([97a38ad](https://github.com/InformaticsMatters/squonk-frontend/commit/97a38ad423611ddcded6bda181e371ac49763a2b))
* **tasks:** Add instance details to cards ([2d1ebc9](https://github.com/InformaticsMatters/squonk-frontend/commit/2d1ebc94fda808fd42cb03a9666e01ca60c71000))
* **tasks:** Add linking between jobs and the tasks page (via a new task route) ([857e068](https://github.com/InformaticsMatters/squonk-frontend/commit/857e0686abcc83a33850a87f9712dfa596e8171b))
* **tasks:** Add option to delete job instances with confirmations ([c1d8c54](https://github.com/InformaticsMatters/squonk-frontend/commit/c1d8c54cb0582bbe4f2d1f1ec3aedb16d692f002))
* **tasks:** Add slide in/out animations to cards ([a7263ce](https://github.com/InformaticsMatters/squonk-frontend/commit/a7263ce29386bccd9f6bc8284ebfefc99ff78dc3))
* **tasks:** Allow the user to delete a task from the list ([f6b0646](https://github.com/InformaticsMatters/squonk-frontend/commit/f6b0646efba42ddb772ed40f35f8a7411a73a1b6))
* **tasks:** Display message in place of empty content ([1c853b2](https://github.com/InformaticsMatters/squonk-frontend/commit/1c853b2ff8eae490f24d5c60f559b15decdeacbe))
* **tasks:** Display more content on tasks page and request collapsed content on reveal ([54a71db](https://github.com/InformaticsMatters/squonk-frontend/commit/54a71dbf8f7749feda7db52279ad6f5d68dce0c2))
* **tasks:** Display nextflow jobs logs instead of an event timeline ([0c2410a](https://github.com/InformaticsMatters/squonk-frontend/commit/0c2410a4ce0707ddad03be9264cf2fd20fc90130))
* **tasks:** Enable polling on single instance page ([463017f](https://github.com/InformaticsMatters/squonk-frontend/commit/463017fae96a3847216752a2655cc8dc486fe621))
* **tasks:** Format times to human readable format ([532ac20](https://github.com/InformaticsMatters/squonk-frontend/commit/532ac20f965e077704710f1e24cb1c2717fefab2))
* **tasks:** Implement search and filter on the tasks page ([76d9a84](https://github.com/InformaticsMatters/squonk-frontend/commit/76d9a84280d06c5e3b0b4363c3218c5103e6eeb2))
* **tasks:** Improve design of listed information at the top of cards ([fe95c82](https://github.com/InformaticsMatters/squonk-frontend/commit/fe95c8277ed8c2871b1510a5b4c86b8ab75d1afa))
* **tasks:** Improve layout of job details ([9741801](https://github.com/InformaticsMatters/squonk-frontend/commit/974180102a62d3274e6cc833bc9248c4176ba353))
* **tasks:** Prettier display of job outputs ([6555460](https://github.com/InformaticsMatters/squonk-frontend/commit/6555460a43b728fa0327a109b3b7b9c4cb2b2394))
* **tasks:** Provide some of the previous options when rerunning a job ([8c772fc](https://github.com/InformaticsMatters/squonk-frontend/commit/8c772fc4943e19938d7a12c70db79e87f3132e33))
* **theme:** Add dark theme ([31089b3](https://github.com/InformaticsMatters/squonk-frontend/commit/31089b32db7d6b59ed6a54e9e673446330abcf19))
* **toasts:** Add toast messages to many app actions ([1494c37](https://github.com/InformaticsMatters/squonk-frontend/commit/1494c37d8027e389cadb282ab4a7b71ee74d7a96))
* **ui/attach-datasets:** :sparkles: Add ability to attch datasets to projects ([a866e9f](https://github.com/InformaticsMatters/squonk-frontend/commit/a866e9f00c0f36cc57d90a65ba6213263b122e19))
* **ui/attach-datasets:** Add file name to attach dataset dialog ([fc61a5f](https://github.com/InformaticsMatters/squonk-frontend/commit/fc61a5f29c700b4f7c1a1f53f60ac331217a1603))
* **ui/attach-datasets:** Add option to select the dataset version ([3107778](https://github.com/InformaticsMatters/squonk-frontend/commit/310777845d78692d3599fa744faf34b762b08d5c))
* **ui/attach-datasets:** Add validation and error handling ([388f3c8](https://github.com/InformaticsMatters/squonk-frontend/commit/388f3c81edaa939bf5b924e22593ed9004ee6849))
* **ui/attach-datasets:** Change defaults to checkboxes options ([7aac784](https://github.com/InformaticsMatters/squonk-frontend/commit/7aac784fc915b809744838b4577cdd26a97367df))
* **ui/attach-datasets:** Implement Immutable and Compress options to the dataset attachment modal ([c476c67](https://github.com/InformaticsMatters/squonk-frontend/commit/c476c675e6fa3ea109672fc287d5a8f75407588c)), closes [#17](https://github.com/InformaticsMatters/squonk-frontend/issues/17)
* **ui/create-instance:** :sparkles: Add basic implementation of instance creation and the application view ([cc75724](https://github.com/InformaticsMatters/squonk-frontend/commit/cc757245b07810945a320817c8e23a104c352380))
* **ui/data-tabe:** Add initial filtering to datasets ([#226](https://github.com/InformaticsMatters/squonk-frontend/issues/226)) ([b9bb7b1](https://github.com/InformaticsMatters/squonk-frontend/commit/b9bb7b1af933d43682eacb32fe523a215282ffd3)), closes [#194](https://github.com/InformaticsMatters/squonk-frontend/issues/194)
* **ui/data-table:** :sparkles: Add custom cell stuff back in and update for the new api ([6b69887](https://github.com/InformaticsMatters/squonk-frontend/commit/6b69887a7f52f0eed98450def7af9c5be01f05f1))
* **ui/data-table:** :sparkles: Migrate the datatable from v1 ([03dca82](https://github.com/InformaticsMatters/squonk-frontend/commit/03dca82a50d2618a9beb33e169e8dc7985b8e029))
* **ui/data-table:** Add ability to display nested file structures ([28788f0](https://github.com/InformaticsMatters/squonk-frontend/commit/28788f00082a62fac72501c73216ee3780563854))
* **ui/data-table:** Add bulk removal of selected datasets ([89172b1](https://github.com/InformaticsMatters/squonk-frontend/commit/89172b1f100cc42c9e86032b2c75d9bdb35bea4e))
* **ui/data-table:** Add expandable rows for datasets ([8e1b0d9](https://github.com/InformaticsMatters/squonk-frontend/commit/8e1b0d9ccb5ae954de06a47366f979de0f7c4dc7))
* **ui/data-table:** Add missing tooltips to dataset actions ([1c6d1b9](https://github.com/InformaticsMatters/squonk-frontend/commit/1c6d1b97bea2a0688a5d6555c8620a28f5e9199c))
* **ui/data-table:** Add Number of projects column ([07a9b1e](https://github.com/InformaticsMatters/squonk-frontend/commit/07a9b1ee16fc62e76c5764759237642ca7447d34))
* **ui/data-table:** Add titles to the datasets and projet table pages ([d139451](https://github.com/InformaticsMatters/squonk-frontend/commit/d13945111f3b818064bae1ca7b533751bcf22fd3))
* **ui/data-table:** Add warning and confirmation when the user wants to delete a dataset ([2d3b91b](https://github.com/InformaticsMatters/squonk-frontend/commit/2d3b91b7720da0b25f8b3a67c0cf3706fd885743))
* **ui/data-table:** Calculate selected rows ([26443d4](https://github.com/InformaticsMatters/squonk-frontend/commit/26443d4924d94e52f6d3ca098231769dd4697b6e))
* **ui/data-table:** Change immutable column to a mode that displays more info about the file ([dd3ddbb](https://github.com/InformaticsMatters/squonk-frontend/commit/dd3ddbb55bc13a19ca94931901e258ed1089be46))
* **ui/data-table:** Display all files in a project with a breadcrumbs based structure ([1ef5413](https://github.com/InformaticsMatters/squonk-frontend/commit/1ef5413e6a209feee8439911c6cf7c6f2c52df14))
* **ui/data-table:** Fix datasets table names and add #versions column ([28f686e](https://github.com/InformaticsMatters/squonk-frontend/commit/28f686ef8fbba8d526e62545f03d0763613f6ea7))
* **ui/data-table:** Implement button to delete unmanaged files from a project ([5dd96a3](https://github.com/InformaticsMatters/squonk-frontend/commit/5dd96a377a25736a35a00f0d8bbcc03606b49f13))
* **ui/data-table:** Replace loading text with CentreLoader component ([fce9add](https://github.com/InformaticsMatters/squonk-frontend/commit/fce9add615094a9f670911a30d0719a859c87970))
* **ui/data-table:** Show whether a file is immutable in the table ([54d74f8](https://github.com/InformaticsMatters/squonk-frontend/commit/54d74f82bd7c0a13717e42ddd7a55ea476015633))
* **ui/file-upload:** Add options per file type ([ff5f2ae](https://github.com/InformaticsMatters/squonk-frontend/commit/ff5f2ae773b863d7ff8f933e52fa8ac036068f63))
* **ui/file-uploader:** :bug: Improve file uploading UI and give processing progress bar for async tasks ([caac6bd](https://github.com/InformaticsMatters/squonk-frontend/commit/caac6bd0090fa1a6c905359920c0160a6c1ec40b))
* **ui/file-upload:** Expand file uploader to full screen modal that presents options for each file type ([c1882c3](https://github.com/InformaticsMatters/squonk-frontend/commit/c1882c3b3693a73e9adb72a56851c54960d90812))
* **ui/file-upload:** Support csv and more new file types for uploads ([c2faafd](https://github.com/InformaticsMatters/squonk-frontend/commit/c2faafd022454224b1089dea0fc7399a70a5fd3c)), closes [#19](https://github.com/InformaticsMatters/squonk-frontend/issues/19)
* **ui/jobs:** Add ability to select files in a project as a shortlist and allow these to be selected in the inputs section of a job card ([074379a](https://github.com/InformaticsMatters/squonk-frontend/commit/074379ac0a35154cecd63c385a8e98cbb6f09af3)), closes [#10](https://github.com/InformaticsMatters/squonk-frontend/issues/10)
* **ui/jobs:** Add fallback text if no inputs/outputs exist for a job ([68c087e](https://github.com/InformaticsMatters/squonk-frontend/commit/68c087ebf3389bef3760ff5159562d88dbd6af0d))
* **ui/jobs:** Add inputs ([5d8033f](https://github.com/InformaticsMatters/squonk-frontend/commit/5d8033fcf211a35ecaf650497b306144cd4335ef))
* **ui/jobs:** Add job "job" field to each execution job card ([f4b00fe](https://github.com/InformaticsMatters/squonk-frontend/commit/f4b00fe5b3af93573be440f37c24c79849218819))
* **ui/jobs:** Add Jobs as cards to the executions tab ([285284e](https://github.com/InformaticsMatters/squonk-frontend/commit/285284e3a2b2f5ba0e3fb3406844375c3a014a2c)), closes [#10](https://github.com/InformaticsMatters/squonk-frontend/issues/10)
* **ui/jobs:** Create DownloadButton component ([4f10411](https://github.com/InformaticsMatters/squonk-frontend/commit/4f104113e6e838f5dd3a0c589a609a8435a45846))
* **ui/jobs:** Create PageSection component ([acc6a39](https://github.com/InformaticsMatters/squonk-frontend/commit/acc6a39491d42121d364fefa009cf8d3d95a244b))
* **ui/jobs:** Order input form inputs ([6e27063](https://github.com/InformaticsMatters/squonk-frontend/commit/6e27063ccdd86ee13f800975c9b89307a9ba9b3a))
* **ui/navigation:** :sparkles: Add a styled navigation bar to the layout ([d8c0a68](https://github.com/InformaticsMatters/squonk-frontend/commit/d8c0a6806c4bbfb05595106555842714953097f7))
* **ui/navigation:** Use Button component for nav links for a hover effect ([9095582](https://github.com/InformaticsMatters/squonk-frontend/commit/9095582778d6dc2bd1df3c50e52ffefe8fad4ade))
* **ui/plain-text-viewer:** Initial plain text viewer implementation ([961632d](https://github.com/InformaticsMatters/squonk-frontend/commit/961632d7535c8b95a8f92940a957ed4224dea7f6))
* **ui/plain-text-viewer:** Wire datasets to the viewer ([aa01617](https://github.com/InformaticsMatters/squonk-frontend/commit/aa01617510fba41e43b2ca10a20fea6148e6a44d))
* **ui/plain-text-viewer:** Wire project files to the viewer ([9b5eac1](https://github.com/InformaticsMatters/squonk-frontend/commit/9b5eac116a87a5948c24b2b5575d356ee60da271))
* **ui/projects:** :sparkles: Add first go at project listing/adding ([5a4cb04](https://github.com/InformaticsMatters/squonk-frontend/commit/5a4cb041ec8481364a2f2e4a4f282c08f6ff21b8))
* **ui/projects:** :sparkles: Migrate project creation from v1 ([a0ececf](https://github.com/InformaticsMatters/squonk-frontend/commit/a0ececfc761997eefd2b79fd382b8d1f6148ff98))
* **ui/projects:** Add button to delete project and icon to see if you're an editor ([f8836fd](https://github.com/InformaticsMatters/squonk-frontend/commit/f8836fd5e8444927c8062be7151e24ed2e3d3aa4))
* **ui/projects:** Add file size and date updated columns ([6e29a14](https://github.com/InformaticsMatters/squonk-frontend/commit/6e29a14f212505cc6b8c22b43b4abc943bff8900))
* **ui/projects:** Add warning & confirmation when the user wants to delete a project ([bd2cea3](https://github.com/InformaticsMatters/squonk-frontend/commit/bd2cea3c97e4e49773017d0fdc715c34950d0bcf))
* **ui/projects:** Display file actions modal ([b9d0d11](https://github.com/InformaticsMatters/squonk-frontend/commit/b9d0d1127aa10491694133169a709b76df9ffda6))
* **ui/projects:** Move project maneger to navbar and add options to add & remove editors ([9063938](https://github.com/InformaticsMatters/squonk-frontend/commit/9063938ce1617c7104b1967559bc04f7916cdaa8))
* **ui/projects:** Refresh UI when deleting/detaching a file ([e614ebb](https://github.com/InformaticsMatters/squonk-frontend/commit/e614ebba2c1c93299c9b730bab75b00294715ac0))
* **ui/upload:** :lipstick: Improve file uploader active style, semantics and fix react key issue ([39c790a](https://github.com/InformaticsMatters/squonk-frontend/commit/39c790a19330f66d01c82c4b02700d2084085449))
* **ui/uploader:** :sparkles: Add initial functionality to upload datasets ([cdd32d6](https://github.com/InformaticsMatters/squonk-frontend/commit/cdd32d6cfd70615e4a0aed853269fe71d2412f17))
* **ui/user-settings:** Add User Settings modal ([28b362a](https://github.com/InformaticsMatters/squonk-frontend/commit/28b362aa82c4c904d65db2c60f6a5a9de508a9ef)), closes [#276](https://github.com/InformaticsMatters/squonk-frontend/issues/276)
* Unit and project creation, user bootstrapping ([#431](https://github.com/InformaticsMatters/squonk-frontend/issues/431)) ([ba8dc55](https://github.com/InformaticsMatters/squonk-frontend/commit/ba8dc55ded5037181f0fc452fff447cf053d9c92))
* **upload:** Add file upload for projects ([e050101](https://github.com/InformaticsMatters/squonk-frontend/commit/e0501011d049f6072517548b5d42f6f8bfbf62f3))


### Bug Fixes

* :ambulance: Fix the missing env vars overiding values from config.json ([c8bfbe6](https://github.com/InformaticsMatters/squonk-frontend/commit/c8bfbe628845f0d1ad181d7934886a2f4cdbb679))
* :bug: Fix bug where label selector doesn't reset after an upload ([2c5e65c](https://github.com/InformaticsMatters/squonk-frontend/commit/2c5e65ceb3ca54aaaf80bb922127235be303e197))
* :bug: Fix edit labels option not populating correctly ([6e90a1a](https://github.com/InformaticsMatters/squonk-frontend/commit/6e90a1a49ce42573e74852bd7d95c7d5fc8e4bdf))
* :bug: Fix wrong path being use due to not updating env variable key to new naming scheme ([bf9e14b](https://github.com/InformaticsMatters/squonk-frontend/commit/bf9e14b24e45d18fc5b08aecf823ae32b86bab08))
* :bug: remove duplicates from the label selection dropdown and only give an option to create a new label if it's actually new ([9a87e4d](https://github.com/InformaticsMatters/squonk-frontend/commit/9a87e4d31118ffae64c954f5a95acf784ce86cd3))
* :bug: Replace URLs to keycloak.json and config.json to be absolute paths based off of "homepage" ([e17bad5](https://github.com/InformaticsMatters/squonk-frontend/commit/e17bad5592573ea40fd77f28d2272fbaa8211340))
* :speech_balloon: Update data tier server url with the changed endpoint in config.json ([8f9299b](https://github.com/InformaticsMatters/squonk-frontend/commit/8f9299b51ccbf76ee475aeb79a327c60a00315a7))
* :wrench: Fix the homepage prop to the new convention ([f68d9c0](https://github.com/InformaticsMatters/squonk-frontend/commit/f68d9c0671023dd2d30d327e819183d6e2d523d4))
* **actions:** Prevent actions from wrapping to a second line ([5185950](https://github.com/InformaticsMatters/squonk-frontend/commit/51859503ba1a12a098e4c7ecc41bfdb2a28d5ad9))
* Add missing title to home page ([fb09dbc](https://github.com/InformaticsMatters/squonk-frontend/commit/fb09dbcce98bf29bb2ef85983c4de98fe235faa1))
* **add-project:** Prevent single character project names that cause a 400 error ([7d2d3c8](https://github.com/InformaticsMatters/squonk-frontend/commit/7d2d3c8c243eef8ea007678528d5f6b6417e6f76)), closes [#267](https://github.com/InformaticsMatters/squonk-frontend/issues/267)
* **api:** Fix restream hanging on large files ([1be8c47](https://github.com/InformaticsMatters/squonk-frontend/commit/1be8c47a0e2de0023e54e949ffac3f4793818353))
* **apps:** Fix not able to run apps due to a invalid name ([7be5889](https://github.com/InformaticsMatters/squonk-frontend/commit/7be5889166dca4ba71e9bca688bd1bdb6473067d))
* **apps:** Load app version with the first available version ([b621ffb](https://github.com/InformaticsMatters/squonk-frontend/commit/b621ffb7774db77391c40e5514603718dec722f5))
* **as-client:** Update to use latest AS open api changes ([145dfe0](https://github.com/InformaticsMatters/squonk-frontend/commit/145dfe07620f11683fafacf856e74938ecda44f7))
* **auth:** :bug: Attempt to improve auth timeout behaviour (probably need work thought) ([be09827](https://github.com/InformaticsMatters/squonk-frontend/commit/be098271dbbac89688efa3136aea1efb6469a1ab))
* **auth:** Fix auth on base url and refresh tokens not being used ([d0de157](https://github.com/InformaticsMatters/squonk-frontend/commit/d0de157557797d94c0cb6ced73d8ec76fbda1916))
* **Authorization:** Don't show project manager when not authorized to view projects ([c85ae33](https://github.com/InformaticsMatters/squonk-frontend/commit/c85ae333ece8a4623f12209da3769eabb10fff87))
* **Authorization:** Remove empty module ([ee3f99e](https://github.com/InformaticsMatters/squonk-frontend/commit/ee3f99ee26c4ba0b7b61a33a43d8376964d3ad0d))
* **config:** :wrench: Make package private in package.json to prevent lerna from publishing it when used as a subrepo ([3fc6f4a](https://github.com/InformaticsMatters/squonk-frontend/commit/3fc6f4ab8a58261847aff8a492cd768bac5017b7))
* **create-project:** Require project name to match regex (adds client-side validation to new project names) ([7f4b103](https://github.com/InformaticsMatters/squonk-frontend/commit/7f4b103718cc2f36a9a431144c8b74f4188e5d50)), closes [#455](https://github.com/InformaticsMatters/squonk-frontend/issues/455)
* **dataset-actions:** Add missing header ([cdd283e](https://github.com/InformaticsMatters/squonk-frontend/commit/cdd283e34c5baba0079c67f03acddc96d1a6dac6))
* **dataset-details:** Fix labels and attached projects not updating ([4c9dfc5](https://github.com/InformaticsMatters/squonk-frontend/commit/4c9dfc5af803e42ba70a0d69e75f63d15c47692e))
* **dataset-details:** Fix wrong dataset name displayed ([4826f6b](https://github.com/InformaticsMatters/squonk-frontend/commit/4826f6bc765888b21be2afe0a035023ecf01cbc1))
* **dataset-from-unmanaged-file:** Fix tooltip text ([647c5e3](https://github.com/InformaticsMatters/squonk-frontend/commit/647c5e35d58d218bd24fc7994e3f97b47dc4aac9)), closes [#223](https://github.com/InformaticsMatters/squonk-frontend/issues/223)
* **delete-dataset:** Fix a version not being selected when a version is deleted ([509eb9e](https://github.com/InformaticsMatters/squonk-frontend/commit/509eb9ed9da83c46e5666e3c6351712997ab6b57))
* **delete-dataset:** Fix duplicate versions showing in dialog ([e1164c4](https://github.com/InformaticsMatters/squonk-frontend/commit/e1164c407db7eecf252ae99228a4f36f004e95a8))
* **delete-dataset:** Fix the dialog from not closing on delete ([3d23ba0](https://github.com/InformaticsMatters/squonk-frontend/commit/3d23ba08094cee3a31922feb0ce4b1f5ab1419c0))
* **delete-dataset:** Prevent the user from attempting to delete versions that are not in a DONE state ([74828af](https://github.com/InformaticsMatters/squonk-frontend/commit/74828afbb3f2747138a55e9f126a1a28bbe13537))
* **delete-modal:** Improve actions after async delete happens to reduce warnings/errors ([4aed380](https://github.com/InformaticsMatters/squonk-frontend/commit/4aed380235c494caa5bc97b014dd50cc0e1a9695))
* **deps:** Attempt to fix merge conflict with master ([c2a2a27](https://github.com/InformaticsMatters/squonk-frontend/commit/c2a2a2786a622ed0045961141a0e9b985a8c9fa8))
* **deps:** pin dependencies ([#443](https://github.com/InformaticsMatters/squonk-frontend/issues/443)) ([678e97d](https://github.com/InformaticsMatters/squonk-frontend/commit/678e97dc1a822fdc48b937803cb9b0f909294233))
* **editor:** Fix eslint, prettier and husky for when this repo is not used as part of the monorepo ([fc565b5](https://github.com/InformaticsMatters/squonk-frontend/commit/fc565b5c0f36637b54ee83378d7e3fe001068211))
* **editor:** Fix husky not being run ([08ffc2e](https://github.com/InformaticsMatters/squonk-frontend/commit/08ffc2e903acc827118def33f5ab27b94bc7f6bf))
* **editor:** Fix lint-satged running eslint on all files and not just staged ones ([018e732](https://github.com/InformaticsMatters/squonk-frontend/commit/018e7320bbd98bb930f4d3f23f5b60455fddc942))
* **env-vars:** Fix nextjs build failing due to Sass env var ([7006297](https://github.com/InformaticsMatters/squonk-frontend/commit/70062970dffdffbd990aaef7c24d0ee9a9231f52))
* **executions-cards:** Fix grid layout of application modal form ([dc9e923](https://github.com/InformaticsMatters/squonk-frontend/commit/dc9e9237a00fd0f0cc7ff8f0f5eb01590ed06709))
* **executions-cards:** Fix undefined application_id in job execution request ([a5f05d7](https://github.com/InformaticsMatters/squonk-frontend/commit/a5f05d7a1dc435db388b8438e9e0f43f51116f03))
* **executions-cards:** Use actual job name in card title and remove subtitle ([c043abc](https://github.com/InformaticsMatters/squonk-frontend/commit/c043abcfb9ad831ab2cb20bccede7b2b8894c31d))
* **executions-cards:** Use correct app id now the api has been updated to match the spec ([92ca163](https://github.com/InformaticsMatters/squonk-frontend/commit/92ca16360820b6cf4641c018e0f05d5200d14ce4))
* **executions-cards:** Use previously selected files as initial value when rerunning a job from a previous instance ([eb12fa7](https://github.com/InformaticsMatters/squonk-frontend/commit/eb12fa70aab0a574a6bc62b1bbc373e50415783e))
* **executions:** Remove button from search bar was it's not a button ([ed493e7](https://github.com/InformaticsMatters/squonk-frontend/commit/ed493e77108f02be67eca28d3031fbb9c6f31e69))
* **file-selection:** Attempt a fix to the display when a folder is selected ([8a3aa93](https://github.com/InformaticsMatters/squonk-frontend/commit/8a3aa93a90009c0f0770b34317692c4ff895cd3b))
* **file-selection:** Display items in alphabetical order ([c7a1fa8](https://github.com/InformaticsMatters/squonk-frontend/commit/c7a1fa8c3b8c80d179d8b2f9dd4b6e635eeb8bd2)), closes [#463](https://github.com/InformaticsMatters/squonk-frontend/issues/463)
* **file-selection:** Fix selection of files when rerunning a job (correct fallback order) ([946a00b](https://github.com/InformaticsMatters/squonk-frontend/commit/946a00bea881c0f8425fbc420ecc26e7064cce42)), closes [#464](https://github.com/InformaticsMatters/squonk-frontend/issues/464)
* **file-selection:** Improve file selection by storing whether a row is a file or a directory ([20c548d](https://github.com/InformaticsMatters/squonk-frontend/commit/20c548de0fb243d7fc1d5917c727b00374980a3f))
* Fix error display and remove debug code ([51485b7](https://github.com/InformaticsMatters/squonk-frontend/commit/51485b7aa4e6aad8a8640c974f041bccfb14a146))
* Fix potential errors with onClick of two buttons not being on the button but the icon ([2bbee1a](https://github.com/InformaticsMatters/squonk-frontend/commit/2bbee1a9f2a42c30e9ccfe586c692535e750a89e))
* Fix remaining dot separated list with a Mui list on the app operation card ([a0b79be](https://github.com/InformaticsMatters/squonk-frontend/commit/a0b79bebd0e93ee659d801133c02cf60564d176b))
* Fix typo in example .env ([46b3bd8](https://github.com/InformaticsMatters/squonk-frontend/commit/46b3bd876423ff39aaf820a51104a49e14441fb5))
* **fonts:** :bug: Add global sass varaible (via next config) to [@font-face](https://github.com/font-face) urls to use env variable so that we can access fonts from staging site ([1656b85](https://github.com/InformaticsMatters/squonk-frontend/commit/1656b85c174331e85bb83fd5ab68d7dbe2abfe4e))
* **instance-page:** Fix duplicate instance id in url when clicking instance link on executions page ([9c57fa1](https://github.com/InformaticsMatters/squonk-frontend/commit/9c57fa13ca0f34cf6ee05d8376c510e942672f10)), closes [#441](https://github.com/InformaticsMatters/squonk-frontend/issues/441)
* **instance-page:** Poll details of instance and not just the top level information ([d6f4ed8](https://github.com/InformaticsMatters/squonk-frontend/commit/d6f4ed86e21dfe7b8ec1d34a394034589a582b69)), closes [#224](https://github.com/InformaticsMatters/squonk-frontend/issues/224)
* **job-file-inputs:** Display loader when loading and message when no files match ([ab5d0ec](https://github.com/InformaticsMatters/squonk-frontend/commit/ab5d0ec4f87b4c321c69d423104e0e600c2ada62))
* **job-file-inputs:** Fix selection directories in jobs ([2e3cefe](https://github.com/InformaticsMatters/squonk-frontend/commit/2e3cefe961d3e5d20786b65a3d1e658d9b578139))
* **job-file-inputs:** Fix state not resetting when project is changed ([57ef27d](https://github.com/InformaticsMatters/squonk-frontend/commit/57ef27d7236b618b71eb8e8eaf3ad559b655672c))
* **job-file-inputs:** Use default values in job input fields ([1c5fcc9](https://github.com/InformaticsMatters/squonk-frontend/commit/1c5fcc9eb4a345178c72ccc8fe1e1458e1eef07d))
* **jobs:** Fix error caused by states / events not being populated when they are expected to be ([778a4a5](https://github.com/InformaticsMatters/squonk-frontend/commit/778a4a5436ce86a8810bc2b3e3db799fed88cbe5))
* **jobs:** Fix instance name not using the default name (from job.job) in the request ([d60fbd2](https://github.com/InformaticsMatters/squonk-frontend/commit/d60fbd2875fb4633277a9950ea13bb8fa0f8cda6)), closes [#90](https://github.com/InformaticsMatters/squonk-frontend/issues/90)
* **jobs:** Fix job execution due to api change (it's now compliant with open api) ([c8e7a80](https://github.com/InformaticsMatters/squonk-frontend/commit/c8e7a800f02538fa8a0bcc44f2cd1ba0e50cfc84))
* **jobs:** Fix job matching by match against id and job ([98d9f1f](https://github.com/InformaticsMatters/squonk-frontend/commit/98d9f1f41a0e3c9804a5e98567bc3213300d59b0))
* **jobs:** Fix mimeType filtering of files in job forms ([3cd99ba](https://github.com/InformaticsMatters/squonk-frontend/commit/3cd99ba878ea949caec2775de48874eadae4030d))
* **jobs:** Fix some styling due to theme change ([180cd0c](https://github.com/InformaticsMatters/squonk-frontend/commit/180cd0c0ac491bb62fd0966473a0f739023f0164))
* **jobs:** Fix type errors caused by client update to 0.5.5 ([cb77e10](https://github.com/InformaticsMatters/squonk-frontend/commit/cb77e1095a28997845dabc18c3c4ab510615198b))
* **jobs:** Fix width of job name text field ([1d7619e](https://github.com/InformaticsMatters/squonk-frontend/commit/1d7619edafbd629e4a1b241e60382c9f32b55f14))
* **labels:** Add missing tooltip to add label icon button ([f6f12dd](https://github.com/InformaticsMatters/squonk-frontend/commit/f6f12dda2654d48ee41fbb9ecf4e007d011e95b8))
* **labels:** Allow empty label values and remove length restriction ([cb0f5eb](https://github.com/InformaticsMatters/squonk-frontend/commit/cb0f5eb9aec4ea1dc5bc99159b369bb41e248609))
* **labels:** Enforce lowercase labels ([e5a912c](https://github.com/InformaticsMatters/squonk-frontend/commit/e5a912c1abc584ee1afbd68de3e64432256ceb90))
* **labels:** Fix and tidy up labels ([14e0098](https://github.com/InformaticsMatters/squonk-frontend/commit/14e00981684de9d1249773f1fb53a67cbbcc54b9))
* **labels:** Fix display of labels with empty values ([bed47d9](https://github.com/InformaticsMatters/squonk-frontend/commit/bed47d95b1e3e91941b7598a96f9ca3530dd4e4a))
* **labels:** Fix label button not showing in dataset details view ([3b4be1a](https://github.com/InformaticsMatters/squonk-frontend/commit/3b4be1a8c46766934c64ab388598d1341c855f25)), closes [#261](https://github.com/InformaticsMatters/squonk-frontend/issues/261)
* **labels:** Fix labels not updating in the dataset details UI when adding/removing ([c67a05b](https://github.com/InformaticsMatters/squonk-frontend/commit/c67a05b435a119d8aa63edab529b87338134fc48))
* **mdx:** Fix title on mdx home page ([4e48058](https://github.com/InformaticsMatters/squonk-frontend/commit/4e4805887bcd0033ae11c0f0586f5aff6b738eaa))
* **modals:** Disable formik submit if fields are invalid ([3d11b9c](https://github.com/InformaticsMatters/squonk-frontend/commit/3d11b9c4c4c1aab031403ff127878acebb7578a2))
* **modals:** Fix isValid not being passed to the modal children ([986404e](https://github.com/InformaticsMatters/squonk-frontend/commit/986404e6406e79ce8abc5d582701af3712240bef))
* **navigation:** Simplify navbar on tablet-sized displays ([80e2a56](https://github.com/InformaticsMatters/squonk-frontend/commit/80e2a56af8ef806252c044de6d3dd97ef7d0c9e5))
* **nextjs:** Add external resolver option to dm api proxy to prevent noise in the logs ([e22f902](https://github.com/InformaticsMatters/squonk-frontend/commit/e22f9029d2f198c76b5f0a7a5633046155dc619f))
* **nextjs:** Fix material-ui SSR by extending mui-nextjs example ([f95dba1](https://github.com/InformaticsMatters/squonk-frontend/commit/f95dba161e51f23ccb0584ef08a090faf3d093f6))
* **nextjs:** Fix missing quotes in asset url definition ([09dd5e9](https://github.com/InformaticsMatters/squonk-frontend/commit/09dd5e925cd6465433f12cc62bb78b9bb2330b34))
* **nextjs:** Remove staging env and update Dockerfile ([897e581](https://github.com/InformaticsMatters/squonk-frontend/commit/897e581ff6cbee8694d39cb695f9873bf747fab3))
* **orval:** fix orval dep version in package.json ([737c6b4](https://github.com/InformaticsMatters/squonk-frontend/commit/737c6b444e1b30fdbb93b3fbfd1039c542a99d6d))
* **orval:** Fix some type issues caused by the 0.4 update ([7379b81](https://github.com/InformaticsMatters/squonk-frontend/commit/7379b81f0696263afd0c49b14416e9123e34a002))
* **orval:** Fix tasks polling which broke due to orval's api change ([b8b78cc](https://github.com/InformaticsMatters/squonk-frontend/commit/b8b78cccb07fd84ddd891912cb36200375be9d51))
* **orval:** Fix the error types in some api calls and clean up type assertions ([387b67a](https://github.com/InformaticsMatters/squonk-frontend/commit/387b67af313a89cafe94da2a6fcc08bd63a26aa5))
* **orval:** Update client to latest build and remove unnecessary optional chaining ([9cee86b](https://github.com/InformaticsMatters/squonk-frontend/commit/9cee86bccfd9e085e8f266e6744f642386a405bb))
* **orval:** Update import name due to client rename ([901916a](https://github.com/InformaticsMatters/squonk-frontend/commit/901916ab51603c84c2104651908d3bafeb24bdf9))
* **orval:** Update orval query calls now return types are semi-fixed ([bcfbf59](https://github.com/InformaticsMatters/squonk-frontend/commit/bcfbf59a41f6930539a40702cc2a13d11d095b54))
* **orval:** Update to API 0.6 and fix type errors caused by orval update ([f8293ca](https://github.com/InformaticsMatters/squonk-frontend/commit/f8293cab9d2d9dd79ba5278ea79685a0bf9ee326))
* **orval:** Update to latest open api client and fix issues caused by required fields ([7e95e40](https://github.com/InformaticsMatters/squonk-frontend/commit/7e95e4037d68afa6a5efd79deb7e22ce61f9c235))
* **orval:** Update to latest orval client version and fix some issues it fixed ([9014ab4](https://github.com/InformaticsMatters/squonk-frontend/commit/9014ab40d157fecf20173ef8f9dcafdc63b9544a))
* **orval:** Update to latest orval client version that fixes some type issues with mutations ([4fde7c1](https://github.com/InformaticsMatters/squonk-frontend/commit/4fde7c1f5303ef1abfec02d0b5be5415b73bb3e0))
* **orval:** Upgrade data manager client ([755f177](https://github.com/InformaticsMatters/squonk-frontend/commit/755f177a5d69d165b0654ca9532dde9b4efda37f))
* **project-bootstrap:** Fix when the first time user bootstrap is displayed ([57b0cff](https://github.com/InformaticsMatters/squonk-frontend/commit/57b0cff517c78dd0e3af2132bcf923523813f058))
* **project-path:** Clear project path when switching tab ([2e03307](https://github.com/InformaticsMatters/squonk-frontend/commit/2e03307f12544b181eaa35c714cecfd9f25de2ad))
* **project-state:** Chnage some hook usage to props to allow reusability outside of the selected project context ([5f25d35](https://github.com/InformaticsMatters/squonk-frontend/commit/5f25d3517733966f3e198c5260d19d60597d0bd9))
* **proxy:** Add auth proxy for AS ([7220a19](https://github.com/InformaticsMatters/squonk-frontend/commit/7220a195727918ce2cc8278b717e87ad38753103))
* **proxy:** Fix noise in logs created by update to next proxy api route ([014a892](https://github.com/InformaticsMatters/squonk-frontend/commit/014a8928317f1e515f12cf02e09060bb4151e5e3))
* **proxy:** Provide correct error message when AS env var isn't provided ([88c5bc8](https://github.com/InformaticsMatters/squonk-frontend/commit/88c5bc8321469304baea78bc6672da0750d88ca3))
* **react-query:** :ambulance: Implement properly the query provider ([ed6496c](https://github.com/InformaticsMatters/squonk-frontend/commit/ed6496c40a97f405e04bd6ee260179d4fc166393))
* Remove console log ([ab23081](https://github.com/InformaticsMatters/squonk-frontend/commit/ab230810851aaba169dd8b58ef78b806fbf78b75))
* Remove old rewrite of .env ([0eafbde](https://github.com/InformaticsMatters/squonk-frontend/commit/0eafbdeebe44056f0ba3717aec3d2afd403cdb7e))
* Remove rsc test ([42ef512](https://github.com/InformaticsMatters/squonk-frontend/commit/42ef5129bb1044069b47d413f3f3a61275c4d879))
* Remove space in server log ([d74b3c5](https://github.com/InformaticsMatters/squonk-frontend/commit/d74b3c5d15db2a6c66b2da481522c8f42a602f57))
* **responsive:** Make the nav bar responsive to various screen sizes ([46017ca](https://github.com/InformaticsMatters/squonk-frontend/commit/46017cae683d28f8066d96c871deaf007ff205a9))
* **results-io:** Fix overflowing text when file names are long ([0b87292](https://github.com/InformaticsMatters/squonk-frontend/commit/0b87292a1f1a5dd19bb769fb80eb9db35f1df27c)), closes [#412](https://github.com/InformaticsMatters/squonk-frontend/issues/412)
* **results-page:** Display job inputs and outputs in a less worrying colour ([848175a](https://github.com/InformaticsMatters/squonk-frontend/commit/848175acbc2f279485369951abb1dd1845bf67b3)), closes [#372](https://github.com/InformaticsMatters/squonk-frontend/issues/372)
* **sentry:** Fix crash caused by misconfigured sentry ([9b94ff3](https://github.com/InformaticsMatters/squonk-frontend/commit/9b94ff34a664fb3ea503edb6b962e4bba8c88c82))
* **sort-dataset:** Fix editor sorting ([c9b726a](https://github.com/InformaticsMatters/squonk-frontend/commit/c9b726a0060d31763c0fbf2f39a4641228f46d39))
* **tasks/job-files:** Fix paths links for subpaths ([32e30c8](https://github.com/InformaticsMatters/squonk-frontend/commit/32e30c82fceee1eeec3378f57d236a46f12c6976))
* **tasks:** Always show the status of each state even when there is a message ([83bfa03](https://github.com/InformaticsMatters/squonk-frontend/commit/83bfa03376e54f86c0847862ba760e127052cce0)), closes [#309](https://github.com/InformaticsMatters/squonk-frontend/issues/309)
* **tasks:** Display path even if link isn't available ([e18d8b6](https://github.com/InformaticsMatters/squonk-frontend/commit/e18d8b6264648bfb3f6e398f0bda53353bae12b4))
* **tasks:** Fix bug when linking to a projects file from the task page with no project selected ([741d7d3](https://github.com/InformaticsMatters/squonk-frontend/commit/741d7d300347ce5551c53926cacd870af9aff128))
* **tasks:** Fix state change to unmounted task console error ([346c069](https://github.com/InformaticsMatters/squonk-frontend/commit/346c0698ca0f7e361d179845a76fb8b03658acfa))
* **tasks:** Fix type error created by client update ([c33d65b](https://github.com/InformaticsMatters/squonk-frontend/commit/c33d65b83cf0de4fa5cbb4458e582de3ee8f96db))
* **tasks:** Handle links to files with globs in job outputs ([8540172](https://github.com/InformaticsMatters/squonk-frontend/commit/854017226eab845312c9decbaf9445a7d62d06f2))
* **tasks:** Improve path linking from tasks to files ([8a03689](https://github.com/InformaticsMatters/squonk-frontend/commit/8a036897dee6c7f5ab758235094bc7f74668cf44))
* **tasks:** Show delete for finish instances instead of terminate ([6c5bfb4](https://github.com/InformaticsMatters/squonk-frontend/commit/6c5bfb486492d6f301cecbc0206bdeeb0136fb58))
* **typescript:** Fix catch error types due to changes in ts@4.4 ([d9baf2d](https://github.com/InformaticsMatters/squonk-frontend/commit/d9baf2d0d03e770083bcbb5f9d665beb85b0a05c))
* **ui/attach-datasets:** :bug: Update API version and fix issue caused by API change (File POST) ([03c26b8](https://github.com/InformaticsMatters/squonk-frontend/commit/03c26b8ee3f6e18f528eb8a1ec189cb9316feb16))
* **ui/attach-datasets:** Ensure the selected version has finished processing ([fe8a219](https://github.com/InformaticsMatters/squonk-frontend/commit/fe8a219ba2c1b2cd821ce58f7f1cc135566964d6))
* **ui/attach-datasets:** Fix inability to submit an path that's ermpty by defaulting to '/' ([d94267f](https://github.com/InformaticsMatters/squonk-frontend/commit/d94267f8cbb19d1166186af68eaa4b54b60f9b21))
* **ui/attach-datasets:** Select the newest version by default ([36886d2](https://github.com/InformaticsMatters/squonk-frontend/commit/36886d288161e2edd634761d87b9bf270a44d09f))
* **ui/attach-datasets:** Show only the project the user can edit ([debf597](https://github.com/InformaticsMatters/squonk-frontend/commit/debf5971e6cca4b95807a3b802dd3a5c071ec807))
* **ui/attach-datasets:** Use a better regex for path validation ([8c5f77e](https://github.com/InformaticsMatters/squonk-frontend/commit/8c5f77e1ef8f1e830d68bb1bf96b1e948b3c1b98))
* **ui/create-instance:** :bug: Prevent user from submitting new instance with bad data ([d06d6b8](https://github.com/InformaticsMatters/squonk-frontend/commit/d06d6b813421bf0b2bdccd439a57306477cd4dc8))
* **ui/create-instance:** Fix grid breakpoints to display cards better on various screen sizes ([d74d6e6](https://github.com/InformaticsMatters/squonk-frontend/commit/d74d6e6fd931420bb023f9c19b172a0efd03fd3f))
* **ui/data-table:** :bug: Fix the detach file functionality that was broken in the latest api upgrade ([ae43a1e](https://github.com/InformaticsMatters/squonk-frontend/commit/ae43a1e00f79dc39c67d9d3e9eedc49c9a197286))
* **ui/data-table:** Fix all rows selection not working ([3eeda1f](https://github.com/InformaticsMatters/squonk-frontend/commit/3eeda1f5ea824cbc44f055dcc867ac019cd7b07f))
* **ui/data-table:** Fix fullPaths not being constructed properly in the table ([8d65d0e](https://github.com/InformaticsMatters/squonk-frontend/commit/8d65d0ea99d5c9912aabd61b70304308254b7c51))
* **ui/data-table:** Fix selection of all files ([666d76e](https://github.com/InformaticsMatters/squonk-frontend/commit/666d76e4c73ba6f813b9e422dffb2e5e6a9f7ec4))
* **ui/data-table:** Tidy up type definition and fix bugs caused by previous large change to the data table ([0cb932f](https://github.com/InformaticsMatters/squonk-frontend/commit/0cb932f8e0fb500cd12f33383c2931d7caf0caa2))
* **ui/data-table:** Update loading text for datasets ([05c4b78](https://github.com/InformaticsMatters/squonk-frontend/commit/05c4b78f7dbcdb6201af02cfa3af6c8f4ae35ad2))
* **ui/file-upload:** :bug: Fix responsive layout of file uploaders ([d24d40e](https://github.com/InformaticsMatters/squonk-frontend/commit/d24d40eced873f322a0198cd220e3d76791fc381))
* **ui/file-upload:** Disable body parser to allow .gz files to be uploaded ([e09dfc7](https://github.com/InformaticsMatters/squonk-frontend/commit/e09dfc7c8f066c5d82b43c886ec6d71d8127538d))
* **ui/file-upload:** Don't skip molecule load - i.e. generate schemas when the UI uploads files ([2bb6e52](https://github.com/InformaticsMatters/squonk-frontend/commit/2bb6e527bf3e2eed59575f20c0686d6e8b147dda))
* **ui/file-upload:** Fix file selection opening when changing extension ([33721ac](https://github.com/InformaticsMatters/squonk-frontend/commit/33721ac5b7a6195b0c747317ec5b8e4b5e4ba4d5))
* **ui/file-upload:** Fix react giving dupe key error when the same error message appears twice ([5079c8d](https://github.com/InformaticsMatters/squonk-frontend/commit/5079c8dd36777001fd0ce14c3430c63260644f16))
* **ui/file-upload:** Fix uploaded files not appearing in the datasets list after the upload finishes & after deletion ([b3e07aa](https://github.com/InformaticsMatters/squonk-frontend/commit/b3e07aa5f611c21333d5f1483cc02ee5aaa74f0d))
* **ui/file-upload:** Prefech types to ensure the mimetypes lookup is populated before selecting a file ([aa9c2f6](https://github.com/InformaticsMatters/squonk-frontend/commit/aa9c2f6b7f43adfef89cb38fb3daf29083ac054e))
* **ui/navigation:** Fix active prop being passed to native button by emotion ([0532460](https://github.com/InformaticsMatters/squonk-frontend/commit/0532460bb65793d0e06fc0e9741bb829b7a9fe0b))
* **ui/navigation:** Fix mobile navigation links ([3cdf25c](https://github.com/InformaticsMatters/squonk-frontend/commit/3cdf25c332cc2322821d7a94020c6963aacdd914))
* **ui/navigation:** Update header with better styling on the nav and update the ordering ([0304805](https://github.com/InformaticsMatters/squonk-frontend/commit/030480510413959f563f686d63259de2d17b40d3))
* **ui/plain-text-viewer:** Use singular for 1 line instead of plural ([45c3a11](https://github.com/InformaticsMatters/squonk-frontend/commit/45c3a1139ec14c7b22ab6f8070f472b8e376b60c))
* **ui/projects:** :bug: Make upload & project actions on one line above the table ([dd86bd0](https://github.com/InformaticsMatters/squonk-frontend/commit/dd86bd06b8b4ac96bbba765b9135e7b2501cf9e6))
* **ui/projects:** Display an error when a project path can't be found ([8dbf841](https://github.com/InformaticsMatters/squonk-frontend/commit/8dbf8414fa66f08b1d19810771f941b77b6ce634))
* **ui/projects:** Fix chips display to make them wrap when there are many ([3a4759d](https://github.com/InformaticsMatters/squonk-frontend/commit/3a4759dd9ba6ef39c0cd433337e58c22d3f0b5b8))
* **ui/projects:** Fix editor icon not being shown on projects that you aren't the owner of ([6acc315](https://github.com/InformaticsMatters/squonk-frontend/commit/6acc315b21d31941d6f0dcace4e74a0418d25fa9))
* **ui/ui/create-instance:** :bug: Wait for the started state instead of done for the progress bar ([2b9bee7](https://github.com/InformaticsMatters/squonk-frontend/commit/2b9bee74fd36a81f6c1c49f0579a02bea79216e3))
* **ui/user-settings:** Fix rounding error in Usage bar chart ([80105ab](https://github.com/InformaticsMatters/squonk-frontend/commit/80105abbc6ae570c49109e162f0e402d1e0ded6e))
* **ui:** Fix logo url when using a base_path ([ed18a8e](https://github.com/InformaticsMatters/squonk-frontend/commit/ed18a8ea6e3d2c379218ffc82e12204f424e22f3))
* **upload:** Fix uploading of files with dots in their names ([85fc761](https://github.com/InformaticsMatters/squonk-frontend/commit/85fc761beb03a3ed642f56b5366c0c59d326d20c)), closes [#283](https://github.com/InformaticsMatters/squonk-frontend/issues/283)
* **user:** Fix position of user menu icon ([b04ab3b](https://github.com/InformaticsMatters/squonk-frontend/commit/b04ab3bf40bfa200445d7b1aaa1758d3bce9e693))
