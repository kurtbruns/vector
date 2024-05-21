# Vector

Vector is a library for creating interactive math graphics on the web.

## Getting Started

See [the sandbox](https://github.com/kurtbruns/vector-sandbox) for an environment that uses the library.

## Development Workflow 

1.	Create a Feature Branch:
    
    Start development on a new feature or bug fix in a separate branch.

    ```sh
    git checkout -b feature/your-feature
    ```
    
2.	Commit Changes in the Feature Branch:

    Commit your changes regularly.
    
    ```sh
    git add . and git commit -m "Your commit message"
    ```

3.	Open a Pull Request (PR):

    Once your changes are ready, open a PR to merge your feature branch into the main branch.

    Ensure the PR undergoes code review and passes all tests.

4.	Merge the PR:

    Once approved, merge the PR into the main branch and follow the steps for publishing a new version.

    ```sh
    git checkout main
    git merge feature/your-feature
    ```

## Publishing a New Version

1. Commit changes in GIT: Committing changes to your codebase in Git should always come first. It provides a reference point for the changes you made.

2. Update the version number of the library: You should update the version number of your library after committing changes to your codebase. This will ensure the new version number corresponds to the committed changes. This command also creates a new Git tag for the new version.

    - `npm version patch` - This will increment the PATCH version (e.g., from 1.0.0 to 1.0.1). Use this when you make backward-compatible bug fixes.
    - `npm version minor` - This will increment the MINOR version (e.g., from 1.0.0 to 1.1.0). Use this when you add functionality in a backward-compatible manner.
    - `npm version major` - This will increment the MAJOR version (e.g., from 1.0.0 to 2.0.0). Use this when you make incompatible API changes.

3. Publish the changes to the repo.

```sh
git push origin main --follow-tags
```

4. Publish the library to the npm registry: This should be the last step. After committing your changes and updating your version number, you're now ready to publish those changes to the npm registry.

```sh
npm publish
```
