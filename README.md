# Vector

Vector is a library for creating interactive graphics on the web.

## Getting Started

To install the dependencies.

```
yarn install
```

To launch the sandbox.

```
yarn start
```

## Publishing Changes

1. Commit changes in GIT: Committing changes to your codebase in Git should always come first. It provides a reference point for the changes you made.

2. Update the version number of the library: You should update the version number of your library after committing changes to your codebase. This will ensure the new version number corresponds to the committed changes. This command also creates a new Git tag for the new version.

`npm version patch` - This will increment the PATCH version (e.g., from 1.0.0 to 1.0.1). Use this when you make backward-compatible bug fixes.
`npm version minor` - This will increment the MINOR version (e.g., from 1.0.0 to 1.1.0). Use this when you add functionality in a backward-compatible manner.
`npm version major` - This will increment the MAJOR version (e.g., from 1.0.0 to 2.0.0). Use this when you make incompatible API changes.

3. Publish the library to the npm registry: This should be the last step. After committing your changes and updating your version number, you're now ready to publish those changes to the npm registry.