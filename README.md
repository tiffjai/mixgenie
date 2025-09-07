# Mixgenie: An AI Mixing Assistant for Audiotool
![alt text](https://github.com/tiffjai/mixgenie/blob/main/image.jpg?raw=true)

This project contains a TypeScript script for interacting with the Audiotool Nexus API. The main functionality is to list and optionally download all samples referenced by an Audiotool online project. Pass the tracks and metadata through a deep learning ONNX checkpoint, and apply the predicted gain and pan values back to the Audiotools UI. This allows a user to create a gain-staged mix that can be further fine-tuned within the workflow. 

## Features

- **List Samples**: Connects to an Audiotool project and lists all the samples used.
- **Download Samples**: Optionally downloads the listed samples to a local directory.
- **Dynamic SDK Loading**: The script can run even if the Audiotool Nexus SDK is not installed, providing a clear message to the user.
- **Environment Configuration**: Uses a `.env` file to manage sensitive information like personal access tokens and project URLs.

## Prerequisites

- Node.js
- npm

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <[repository-url](https://github.com/tiffjai/tryout)>
    cd audiotooltryout
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Install the Audiotool Nexus SDK:**
    Download the `nexus.tgz` file from the Audiotool developer portal and install it:
    ```bash
    npm install ./nexus.tgz
    ```

4.  **Create a `.env` file:**
    Create a file named `.env` in the root of the project and add the following content:
    ```
    AT_PAT=YOUR_PERSONAL_ACCESS_TOKEN
    AT_PROJECT_URL=https://beta.audiotool.com/studio?project=YOUR_UUID
    DOWNLOAD_DIR=downloads
    ```
    - Replace `YOUR_PERSONAL_ACCESS_TOKEN` with your Audiotool Personal Access Token.
    - Replace `YOUR_UUID` with the UUID of your Audiotool project.
    - `DOWNLOAD_DIR` is the directory where the samples will be saved (defaults to `downloads`).

## Usage

To run the script, use the following command:

```bash
npx ts-node src/list-samples.ts
```

The script will connect to the specified Audiotool project, list all the samples, and download them to the directory specified in your `.env` file.

## Project Structure

-   `src/list-samples.ts`: The main TypeScript script.
-   `package.json`: Project metadata and dependencies.
-   `tsconfig.json`: TypeScript compiler options.
-   `.env`: Environment variables (you need to create this file).
-   `nexus.tgz`: The Audiotool Nexus SDK package (you need to download this).

## Dependencies

-   `@audiotool/nexus`: The Audiotool Nexus SDK.
-   `dotenv`: For loading environment variables from a `.env` file.
-   `ts-node`: To run TypeScript files directly.
-   `typescript`: The TypeScript compiler.



## Tasks:
#### Soumya:
- training the model (almost done) but problem with different ranges in training and audiotools for parameters
- ⁠build a wrapper for the checkpoint
- generating the js checkpoint
- ⁠test system without instrument names and with instrument names: check if much difference in accuracy is there
- ⁠check if model is deterministic
- ⁠Ill check if I can adapt some text conditioning to the model asap
- ⁠Soumya: document model building part

#### Jinjie and Tiffany:
Work on audio tools
- load and download samples from audiotools
- ⁠send back gain and pan values
- ⁠update the UI
- ⁠(try with dummy values for now)
- ⁠Jinjie: document your part

#### Luiz and Sishir:
- work on the UI
- ⁠should input genre : select from provided values
- ⁠we need to figure out how to load the instrument name per track
- ⁠show progress of the backend in an interesting way: for examples, downloading samples, running the model, applying the effects etc
- ⁠if text conditioning possible, how can we provide that in UI
- ⁠One of you document and we can combine everything tomorrow morning.
