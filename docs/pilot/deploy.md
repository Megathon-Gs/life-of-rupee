# Deploying a pilot build to Netlify

Draft deploys only; production waits for G2 sign-off.

1. Log in once: `npx -y netlify-cli login` (opens a browser).
2. Create the site once with a random name, so the link is not guessable: `npx -y netlify-cli sites:create --name ps-<random>` (for example `ps-$(head -c 6 /dev/urandom | base32 | tr 'A-Z' 'a-z' | tr -d '=' | cut -c1-10)`). Note the project ID it prints.
3. Build with the feature flags you need, calling Vite directly: `VITE_CAPSTONE=1 npx vite build`.
   - `VITE_CAPSTONE=1` shows the Financial Futures Centre (it still opens only after Level 12). `?capstone=1` on the URL does the same per visit.
   - Do not set `VITE_CAPSTONE_BRANDING=approved` until the partner approves branding; the default is the neutral name.
4. Check the flag is in the bundle: `grep -o 'capstone:!0' dist/assets/index-*.js` must print a match.
5. Deploy the build as it is: `npx -y netlify-cli deploy --no-build --dir dist --site <project-id>`. Without `--no-build` the CLI rebuilds without your flags and silently overwrites `dist`.
6. Open the Draft URL it prints and look at the street before sharing it.
7. Production (`--prod`) only after the product owner and NGO educator sign G2.
