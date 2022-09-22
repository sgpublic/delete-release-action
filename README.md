# Delete Release Action

This action can delete release/pre-release/draft of given repo.

## Inputs

## `repo`

**Optional** Operation target repository, the format is "owner/repo", default is current repo.

## `release-drop`

**Optional** Whether to delete the release, default is `false`.

## `release-keep-count`

**Optional** The number of releases except the latest release reserved, "-1" means delete all, default is `0`.

## `release-drop-tag`

**Optional** Whether to delete the tag of release, default is `true`.

## `pre-release-drop`

**Optional** Whether to delete the pre-release, default is `false`.

## `pre-release-keep-count`

**Optional** The number of pre-releases except the latest pre-release reserved, "-1" means delete all, default is `0`.

## `pre-release-drop-tag`

**Optional** Whether to delete the tag of pre-release, default is `true`.

## `draft-drop`

**Optional** Whether to delete the draft, default is `true`.

## Example usage

This example will:
+ Keep the latest 3 releases, delete the rest and their tags.
+ Drop all the pre-release and their tag.
+ Drop all the draft release.

```yml
  - uses: sgpublic/delete-release-action@v1.0
    with:
      repo: <owner>/<repoName> # defaults to current repo
      release-drop: true
      release-keep-count: 2
      release-drop-tag: true
      pre-release-drop: true
      pre-release-keep-count: -1
      pre-release-drop-tag: true
      draft-drop: true
    env:
      GITHUB_TOKEN: ${{ secrets.TOKEN }}
```

It is possible for the same tag to have multiple releases, so we recommend enabling `draft-drop` when enabling `*-drop-tag`.