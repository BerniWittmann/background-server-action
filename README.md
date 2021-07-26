# Background Server GitHub Action

<p align="center">
  <a href="https://github.com/BerniWittmann/background-server-action/actions"><img alt="background-server-action status" src="https://github.com/BerniWittmann/background-server-action/workflows/units-test/badge.svg"></a>
</p>

GitHub Action to run a command (e.g. a test) while also running another command (e.g. a server) in the background.

> Please note that this code is mainly derived from [cypress/github-action](https://github.com/cypress-io/github-action), yet this action tries to be more general
## Usage

### Basic

Run a node js server in the background while executing tests

```
name: Run Tests
on: [push]
jobs:
  run-test:
    runs-on: ubuntu-20.04
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Run E2E Tests
        uses: BerniWittmann/background-server-action@v1
        with:
          command: npm run tests
          start: npm start
```

### With Build command

You can also specify a build command before

```
name: Run Tests
on: [push]
jobs:
  run-test:
    runs-on: ubuntu-20.04
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Run E2E Tests
        uses: BerniWittmann/background-server-action@v1
        with:
          command: npm run tests
          build: npm run build
          start: npm run start
```

### Multiple commands command

You can also specify a build command before

```
name: Run Tests
on: [push]
jobs:
  run-test:
    runs-on: ubuntu-20.04
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Run E2E Tests
        uses: BerniWittmann/background-server-action@v1
        with:
          command: npm run generate-docs, npm run tests
          build: npm run build
          start: npm run api, npm run web
```

### Windows

Sometimes on Windows you need to run a different start command. You can use `start-windows` and `command-windows` parameter for this, which takes precedence over the normal commands when on Windows.

```
name: Run Tests
on: [push]
jobs:
  run-test:
    runs-on: ubuntu-20.04
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Run E2E Tests
        uses: BerniWittmann/background-server-action@v1
        with:
          command: npm run tests
          command-windows: npm run tests:windows
          build: npm run build
          start: npm run start
          start-windows: npm run start:windows
```

### Wait for server

If you are starting a local server and it takes a while to start, you can add a parameter `wait-on` and pass url to wait for the server to respond.

```
name: Run Tests
on: [push]
jobs:
  run-test:
    runs-on: ubuntu-20.04
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Run E2E Tests
        uses: BerniWittmann/background-server-action@v1
        with:
          command: npm run tests
          build: npm run build
          start: npm run start
           # quote the url to be safe against YML parsing surprises
          wait-on: 'http://localhost:8080'
```

By default, wait-on will retry for 60 seconds. You can pass a custom timeout in seconds using wait-on-timeout.

```
- uses: BerniWittmann/background-server-action@v1
    with:
      command: npm run tests
      build: npm run build
      start: npm run start
      wait-on: 'http://localhost:8080'
      # wait for 2 minutes for the server to respond
      wait-on-timeout: 120
```

You can wait for multiple URLs to respond by separating urls with a comma

```
- uses: BerniWittmann/background-server-action@v1
    with:
      command: npm run tests
      build: npm run build
      start: npm run start
      wait-on: 'http://localhost:8080, http://localhost:4000'
```

The action will wait for the first url to respond, then will check the second url, and so on.