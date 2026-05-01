import * as github from '@actions/github';
import * as core from '@actions/core';
import { Endpoints } from "@octokit/types";
import { ProxyAgent, type Dispatcher } from 'undici';
import { getProxyUrl } from '@actions/http-client/lib/proxy';
import { Input } from "./Input";

type Release = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"][number];

// Node.js 24's native globalThis.fetch accepts a `dispatcher` option (undici extension)
// but it is not present in the standard TypeScript RequestInit type.
type RequestInitWithDispatcher = RequestInit & { dispatcher?: Dispatcher };

/**
 * Creates a fetch function that uses Node.js's native globalThis.fetch (bypassing
 * the bundled undici in @actions/github@9.x, which conflicts with the built-in
 * undici dispatcher at Symbol.for("undici.globalDispatcher.1")).
 *
 * Proxy support is preserved: when HTTPS_PROXY / HTTP_PROXY env vars are set, a
 * ProxyAgent from the bundled undici is passed as the dispatcher to globalThis.fetch.
 * The Dispatcher.dispatch() interface is stable across undici versions, so the bundled
 * ProxyAgent is compatible with the native fetch.
 */
function createFetch(): typeof globalThis.fetch {
    const apiUrl = process.env['GITHUB_API_URL'] || 'https://api.github.com';
    const proxyUrl = getProxyUrl(new URL(apiUrl));
    if (!proxyUrl) {
        return globalThis.fetch;
    }
    let dispatcher: ProxyAgent;
    try {
        dispatcher = new ProxyAgent({ uri: proxyUrl.href });
    } catch (err) {
        throw new Error(
            `Failed to create proxy agent for ${proxyUrl.href}: ${err instanceof Error ? err.message : String(err)}. ` +
            `Check that HTTPS_PROXY / HTTP_PROXY is set to a valid URL.`
        );
    }
    return (input, init?) =>
        globalThis.fetch(input, { ...init, dispatcher } as RequestInitWithDispatcher);
}

export class Github {
    private readonly octokit: ReturnType<typeof github.getOctokit>;

    private constructor() {
        this.octokit = github.getOctokit(Input.Github.TOKEN, {
            request: { fetch: createFetch() },
        });
    }

    public async listReleases(): Promise<Release[]> {
        return this.octokit.paginate(
            "GET /repos/{owner}/{repo}/releases",
            { ...Input.Github.REPO, per_page: 100 },
        );
    }

    public async dropRelease(release: Release, dropTag: boolean): Promise<void> {
        for (const asset of release.assets) {
            await this.octokit.rest.repos.deleteReleaseAsset({
                ...Input.Github.REPO,
                asset_id: asset.id,
            });
            core.debug(`Release asset dropped: [${release.name ?? release.tag_name}] ${asset.name}`);
        }
        core.debug(`Drop release: ${release.name ?? release.tag_name}`);
        await this.octokit.rest.repos.deleteRelease({
            ...Input.Github.REPO,
            release_id: release.id,
        });
        if (dropTag) {
            core.debug(`Drop tag: ${release.tag_name}`);
            try {
                await this.octokit.rest.git.deleteRef({
                    ...Input.Github.REPO,
                    ref: `tags/${release.tag_name}`,
                });
            } catch (err: unknown) {
                const status = typeof err === 'object' && err !== null && 'status' in err
                    ? (err as { status: number }).status
                    : undefined;
                if (status === 422 || status === 404) {
                    const message = typeof err === 'object' && err !== null && 'message' in err
                        ? (err as { message: string }).message
                        : String(err);
                    core.warning(`Tag '${release.tag_name}' could not be deleted (HTTP ${status}: ${message}), skipping.`);
                } else {
                    throw err;
                }
            }
        }
        core.info(`Release dropped: ${release.name ?? release.tag_name}`);
    }

    private static instance: Github | null = null;

    public static getInstance(): Github {
        if (this.instance === null) {
            this.instance = new Github();
        }
        return this.instance;
    }
}
