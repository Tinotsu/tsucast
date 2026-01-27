# Rollback Procedure

How to revert a bad API deployment on Dokploy/Hetzner VPS.

## 1. Dokploy UI Rollback (Fastest)

1. Open Dokploy dashboard at your VPS IP
2. Navigate to the tsucast API application
3. Go to **Deployments** tab
4. Find the last known-good deployment
5. Click **Redeploy** on that deployment
6. Wait for the container to restart (~30-60s)
7. Verify: `curl -sf https://api.tsucast.com/health`

## 2. Git Revert (If Dokploy History Unavailable)

```bash
# Find the bad commit
git log --oneline -10

# Revert the bad commit
git revert <bad-commit-sha>

# Push to trigger re-deploy
git push origin main
```

Wait for GitHub Actions deploy workflow to complete (~2-3 minutes).

## 3. Docker Image Rollback (If Git SHA Tags Are Configured)

If Dokploy is configured to tag images with git SHA:

```bash
# In Dokploy, change the image tag to the last known-good SHA
docker pull <registry>/tsucast-api:<good-sha>
```

Then redeploy from Dokploy UI with the specific tag.

## 4. Verification Checklist

After any rollback:

- [ ] `curl -sf https://api.tsucast.com/health/ready` returns 200
- [ ] `curl -sf https://api.tsucast.com/health` returns `"status":"ok"`
- [ ] Check Sentry for new errors (should stop after rollback)
- [ ] Check UptimeRobot shows UP status
- [ ] Test a user-facing operation (e.g., generate audio from a URL)

## 5. Where to Check

| What | Where |
|------|-------|
| Error tracking | Sentry dashboard |
| API logs | Dokploy dashboard > Logs tab |
| Uptime status | UptimeRobot dashboard |
| Health endpoint | `https://api.tsucast.com/health` |
| Deploy status | GitHub Actions > Deploy API workflow |

## 6. Post-Rollback

1. Notify the team that a rollback occurred
2. Create an issue documenting what went wrong
3. Fix the root cause on a separate branch
4. Test thoroughly before re-deploying
