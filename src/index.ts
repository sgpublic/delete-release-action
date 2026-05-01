import * as core from '@actions/core';
import { Endpoints } from "@octokit/types";
import { Github } from "./core/Github";
import { Input } from "./core/Input";

type Release = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"][number];

async function run(): Promise<void> {
    const allReleases = await Github.getInstance().listReleases();
    const releasePreview = allReleases.slice(0, 10).map(release => ({
        id: release.id,
        tag_name: release.tag_name,
        name: release.name,
    }));
    core.debug(`Releases total count: ${allReleases.length}; preview: ${JSON.stringify(releasePreview)}`);
    if (allReleases.length === 0) {
        core.info("No releases found, action finished!");
        return;
    }
    core.info(`Releases total count: ${allReleases.length}`);

    if (Input.Release.DROP) {
        const releases = allReleases.filter(r => !r.draft && !r.prerelease);
        if (releases.length > 0) {
            core.info(`Filtered release count: ${releases.length}`);
            await dropReleases(releases, Input.Release.KEEP_COUNT + 1, Input.Release.DROP_TAG);
        } else {
            core.warning("No releases found, skip action.");
        }
    } else {
        core.info("Skip drop release.");
    }

    if (Input.PreRelease.DROP) {
        const prereleases = allReleases.filter(r => r.prerelease && !r.draft);
        if (prereleases.length > 0) {
            core.info(`Filtered pre-release count: ${prereleases.length}`);
            await dropReleases(prereleases, Input.PreRelease.KEEP_COUNT + 1, Input.PreRelease.DROP_TAG);
        } else {
            core.warning("No pre-releases found, skip action.");
        }
    } else {
        core.info("Skip drop pre-release.");
    }

    if (Input.Draft.DROP) {
        const drafts = allReleases.filter(r => r.draft);
        if (drafts.length > 0) {
            core.info(`Filtered draft count: ${drafts.length}`);
            await dropReleases(drafts, Input.Draft.KEEP_COUNT + 1, false);
        } else {
            core.warning("No drafts found, skip action.");
        }
    } else {
        core.info("Skip drop draft.");
    }

    core.info("All task finished!");
}

async function dropReleases(releases: Release[], keep: number, dropTag: boolean): Promise<void> {
    const sorted = releases
        .map(r => ({ release: r, ts: new Date(r.published_at ?? r.created_at).getTime() }))
        .sort((a, b) => b.ts - a.ts)
        .map(({ release }) => release);
    const github = Github.getInstance();
    for (let i = keep; i < sorted.length; i++) {
        await github.dropRelease(sorted[i], dropTag);
    }
}

run().catch(err => {
    core.setFailed(err instanceof Error ? err.message : String(err));
});
