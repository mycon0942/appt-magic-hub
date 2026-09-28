<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## App decisions
- Keep the existing public/agenda.html experience embedded at `/` while the account bridge owns payment settings; this preserves the established dashboard and isolates protected writes from demo content.
- Store provider credentials encrypted through authenticated server functions, never in browser storage; payment settings are per-account and not a live checkout integration.
