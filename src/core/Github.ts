import * as github from '@actions/github';
import * as core from '@actions/core';
import {Input} from "./Input";
import {PaginateInterface} from "@octokit/plugin-paginate-rest";
import {RestEndpointMethods} from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types";

export class Github {
    private readonly octokitRest: RestEndpointMethods;
    private readonly octokitPaginate: PaginateInterface;

    private constructor() {
        const octokit = github.getOctokit(Input.Github.TOKEN);
        this.octokitRest = octokit.rest;
        this.octokitPaginate = octokit.paginate;
    }

    public async listReleases(): Promise<any> {
        return (await this.octokitPaginate("GET /repos/:owner/:repo/releases", Input.Github.REPO));
    }

    public async dropRelease(release: any, dropTag: boolean) {
        for (const asset of release.assets) {
            await this.octokitRest.repos.deleteReleaseAsset(Object.assign(
                Input.Github.REPO, { asset_id: asset.id }
            ));
            core.debug(`Release asset dropped: [${release.name}] ${asset.name}`);
        }
        core.debug(`Drop release: ${release.name}`);
        await this.octokitRest.repos.deleteRelease(Object.assign(
            Input.Github.REPO, { release_id: release.id }
        ));
        if (!dropTag) return;
        core.debug(`Drop tag: ${release.tag_name}`);
        await this.octokitRest.git.deleteRef(Object.assign(
            Input.Github.REPO, { ref: `tags/${release.tag_name}` }
        ));
        core.info(`Release dropped: ${release.name}`);
    }

    private static instance: Github | null = null;

    public static getInstance(): Github {
        if (this.instance == null) {
            this.instance = new Github();
        }
        return this.instance;
    }
}
