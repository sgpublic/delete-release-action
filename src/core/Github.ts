import * as github from '@actions/github';
import * as core from '@actions/core';
import {Input} from "./Input";
import {RestEndpointMethods} from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types";

export class Github {
    private readonly octokit: RestEndpointMethods;

    private constructor() {
        this.octokit = github.getOctokit(Input.Github.TOKEN).rest;
    }

    public async listRelease(): Promise<any> {
        return (await this.octokit.repos.listReleases(Input.Github.REPO)).data;
    }

    public async dropRelease(release: any, dropTag: boolean) {
        for (const asset of release.assets) {
            await this.octokit.repos.deleteReleaseAsset(Object.assign(
                Input.Github.REPO, { asset_id: asset.id }
            ));
            core.debug(`drop release assets: [${release.name}] ${asset.name}`);
        }
        core.debug(`drop release: ${release.name}`);
        await this.octokit.repos.deleteRelease(Object.assign(
            Input.Github.REPO, { release_id: release.id }
        ));
        if (!dropTag) return;
        core.debug(`drop tag: ${release.tag_name}`);
        await this.octokit.git.deleteRef(Object.assign(
            Input.Github.REPO, { ref: `tags/${release.tag_name}` }
        ));
        core.info(`release dropped: ${release.name}`);
    }

    private static instance: Github | null = null;

    public static getInstance(): Github {
        if (this.instance == null) {
            this.instance = new Github();
        }
        return this.instance;
    }
}