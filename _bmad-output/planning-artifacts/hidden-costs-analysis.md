---
project: tsucast
date: 2026-01-20
type: hidden-costs-analysis
author: Tino
---

# Hidden Costs Analysis: tsucast

_Potential costs not covered in the primary cost prediction report_

---

## Summary

| Category | Annual Hidden Cost | Risk Level |
|----------|-------------------|------------|
| Developer Accounts | $124 | Certain |
| Monitoring & Observability | $0-500 | Medium |
| Legal & Compliance | $500-5,000 | High |
| Content & Copyright | $0-10,000 | High |
| Failed Operations | $50-500 | Medium |
| Support Tools | $0-600 | Low |
| Marketing & ASO | $0-5,000 | Variable |
| Security | $0-1,000 | Medium |
| **Total Range** | **$674 - $22,724/year** | - |

---

## 1. Developer Account Fees (CERTAIN)

These were completely missed in the original report.

| Platform | Cost | Frequency |
|----------|------|-----------|
| [Apple Developer Program](https://developer.apple.com/programs/) | $99 | Annual |
| [Google Play Console](https://play.google.com/console/) | $25 | One-time |

**Year 1 Total:** $124
**Year 2+ Total:** $99/year

---

## 2. Monitoring & Observability

### Error Monitoring

| Service | Free Tier | Paid |
|---------|-----------|------|
| [Sentry](https://sentry.io/pricing/) | 5K errors/month | $26/month team |
| Bugsnag | 7.5K events/month | $59/month |
| Expo (built-in) | Basic crash reports | Free with EAS |

**Recommendation:** Start with Expo's built-in crash reporting, upgrade to Sentry ($26/month) when scaling.

**Hidden Cost:** $0-312/year

### Analytics

| Service | Free Tier | Paid |
|---------|-----------|------|
| Mixpanel | 20M events/month | $20/month+ |
| PostHog | 1M events/month | $0 (self-host) |
| RevenueCat Analytics | Included | Free |

**Recommendation:** RevenueCat includes basic analytics; add Mixpanel if needed.

**Hidden Cost:** $0-240/year

### Uptime Monitoring

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Better Uptime | 10 monitors | Usually sufficient |
| UptimeRobot | 50 monitors | Free tier is generous |
| Supabase | Dashboard included | Free |

**Hidden Cost:** $0

---

## 3. Legal & Compliance (HIGH RISK)

### Required Documents

| Document | DIY Cost | Lawyer Cost |
|----------|----------|-------------|
| Privacy Policy | $0 (generators) | $500-1,500 |
| Terms of Service | $0 (generators) | $500-1,500 |
| GDPR Compliance | $0 (templates) | $1,000-3,000 |
| Cookie Policy | $0 (generators) | $200-500 |

**Hidden Cost:** $0 DIY, $2,000-6,500 with lawyer

### Potential Legal Issues

| Issue | Risk | Potential Cost |
|-------|------|----------------|
| Copyright claims (parsed content) | Medium | $1,000-50,000+ |
| Voice cloning rights | Low | $5,000-20,000 |
| DMCA takedowns | Medium | Time + legal fees |
| User data breach | Low | $10,000-100,000+ |

**Mitigation:**
- Terms of Service disclaiming responsibility for user-submitted URLs
- Only parse publicly accessible content
- Don't clone real celebrity voices
- Basic security practices

**Hidden Cost:** $0-5,000/year (legal consultation/insurance)

---

## 4. Content & Copyright Risks

### Website Blocking/Rate Limiting

| Issue | Impact | Cost |
|-------|--------|------|
| Sites blocking your scraper | Lost functionality | $0 (just fails) |
| Rate limits | Slower parsing | $0 |
| CAPTCHAs | Parse failures | Proxy services ~$50/month |

**Hidden Cost:** $0-600/year

### Paywalled Content

Users will try to parse paywalled articles and be disappointed when it fails.

| Scenario | Solution | Cost |
|----------|----------|------|
| Soft paywall | Sometimes works | $0 |
| Hard paywall | Graceful error message | $0 |
| Archive services | Don't implement (legal risk) | $0 |

**Hidden Cost:** $0 (just manage expectations)

### PDF Complexity

| Issue | Impact | Solution |
|-------|--------|----------|
| Scanned PDFs (images) | Can't extract text | OCR service |
| Complex layouts | Poor extraction | Better parser |
| Large PDFs | Timeout | Size limits |

**OCR Service Costs (if needed):**
- Google Cloud Vision: $1.50/1000 pages
- AWS Textract: $1.50/1000 pages
- Expected usage: Very low

**Hidden Cost:** $0-50/year

---

## 5. Failed/Wasted Operations

### TTS Failures

| Scenario | Frequency | Cost Impact |
|----------|-----------|-------------|
| Generation fails mid-article | 1-5% | Partial charge |
| Timeout, retry needed | 2-10% | Double charge |
| User cancels mid-generation | Rare | Full charge |
| Rate limit hit, queued | Varies | Delay, not cost |

**Hidden Cost:** Add 5-10% to TTS estimates = $5-100/year

### Storage Waste

| Scenario | Impact |
|----------|--------|
| Orphaned audio (user deletes) | Wasted storage |
| Failed uploads | Partial files |
| Duplicate generations (race condition) | Double storage |

**Mitigation:** Lifecycle policy to delete old unused files

**Hidden Cost:** $0-50/year

### Edge Function Failures

| Scenario | Cost Impact |
|----------|-------------|
| Function times out | Still charged |
| External API fails | Retry = double charge |
| Cold starts | Slightly higher latency |

**Hidden Cost:** Add 5% to Edge Function estimates = $5-50/year

---

## 6. Support & Operations

### Customer Support Tools

| Tool | Free Tier | Paid |
|------|-----------|------|
| Email (Gmail/Zoho) | Free | $6/user/month |
| Help desk (Crisp) | 2 seats free | $25/month |
| Help desk (Intercom) | No free tier | $74/month |

**Recommendation:** Use email + in-app feedback initially.

**Hidden Cost:** $0-300/year

### Email Sending (Transactional)

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Resend | 3,000/month | Supabase integration |
| SendGrid | 100/day | Very limited |
| Supabase Auth | Included | For auth emails |

**Hidden Cost:** $0 (Supabase handles auth emails)

---

## 7. Marketing & Growth

### App Store Optimization (ASO)

| Item | Cost |
|------|------|
| Screenshots/mockups | $0-500 (DIY or designer) |
| App preview video | $0-1,000 |
| Keyword research tools | $0-50/month |
| A/B testing tools | $0-100/month |

**Hidden Cost:** $0-2,000 first year

### Paid Acquisition (Optional)

| Channel | Cost per Install |
|---------|------------------|
| Apple Search Ads | $1-5 |
| Google Ads | $0.50-3 |
| Social (FB/IG/TikTok) | $1-4 |

**If targeting 1,000 paid users with 5% conversion:**
- Need 20,000 installs
- At $2/install = $40,000

**Reality check:** This is why word-of-mouth is the strategy. Paid acquisition is expensive.

**Hidden Cost:** $0 if organic, $1,000-50,000+ if paid

### Influencer/Seeding

| Approach | Cost |
|----------|------|
| Free accounts to influencers | TTS cost only |
| Paid sponsorships | $100-10,000/creator |

**Hidden Cost:** $0-5,000

---

## 8. Security

### API Key Management

| Service | Cost |
|---------|------|
| Environment variables | $0 (built into Expo/Supabase) |
| Secrets manager (Doppler) | Free for small teams |

**Hidden Cost:** $0

### DDoS Protection

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Cloudflare | Included with R2 | Basic protection |
| Supabase | Included | Managed |

**Hidden Cost:** $0

### Security Audit

| Type | Cost |
|------|------|
| Automated scan (Snyk) | Free tier available |
| Manual pentest | $5,000-20,000 |
| Bug bounty | Variable |

**Hidden Cost:** $0-1,000/year (automated tools)

---

## 9. Development & Testing

### Device Testing

| Approach | Cost |
|----------|------|
| Personal devices | $0 |
| BrowserStack/Sauce Labs | $29-199/month |
| AWS Device Farm | $0.17/minute |

**Recommendation:** Use personal devices + EAS builds for testers.

**Hidden Cost:** $0-500/year

### TestFlight/Beta Distribution

| Platform | Cost |
|----------|------|
| TestFlight (iOS) | Free (included in $99) |
| Google Play Internal Testing | Free |
| EAS Internal Distribution | Included in EAS |

**Hidden Cost:** $0

---

## 10. Scaling Surprises

### Supabase Connection Limits

| Plan | Connections |
|------|-------------|
| Free | 60 |
| Pro | 200 |
| Pro + Pooler | 1,500 |

If many concurrent users → connection pooler needed (included in Pro, but config required).

**Hidden Cost:** $0 (just configuration)

### Fish Audio Rate Limits

| Tier | Requests/min |
|------|--------------|
| Free | ? |
| Paid | Higher |

Need to verify Fish Audio's rate limits. May need:
- Request queuing
- Backoff strategy
- Multiple API keys

**Hidden Cost:** $0-100/month if need higher tier

### R2 Class A Operations

| Operation | Cost |
|-----------|------|
| Writes (PUT) | $4.50/million |
| Multi-part uploads | Multiple operations |

For large audio files, multi-part uploads could multiply operation costs.

**Hidden Cost:** Add 20% to R2 estimates = $0-50/year

---

## 11. Time Costs (Non-Monetary)

| Activity | Time Impact |
|----------|-------------|
| App Store review delays | 1-7 days per submission |
| App rejection & fixes | 1-2 weeks |
| API provider outages | User complaints, debugging |
| Customer support | Hours per week |
| Bug fixes | Ongoing |

---

## Revised Cost Estimates

### Year 1 (Launch)

| Category | Original | Hidden | Revised |
|----------|----------|--------|---------|
| Infrastructure | $180 | $0 | $180 |
| Developer Accounts | $0 | $124 | $124 |
| Monitoring | $0 | $0-100 | $50 |
| Legal (DIY) | $0 | $0 | $0 |
| Support Tools | $0 | $0 | $0 |
| Marketing | $0 | $0-500 | $200 |
| Buffer (10%) | $0 | - | $55 |
| **Total Year 1** | **$180** | **$124-724** | **~$610** |

### Year 2+ (Growth - 1,000 subscribers)

| Category | Original | Hidden | Revised |
|----------|----------|--------|---------|
| Infrastructure | $3,204 | $0 | $3,204 |
| Developer Accounts | $0 | $99 | $99 |
| Monitoring | $0 | $312 | $312 |
| Legal | $0 | $500 | $500 |
| Support | $0 | $300 | $300 |
| Marketing | $0 | $1,000 | $1,000 |
| Buffer (10%) | $0 | - | $542 |
| **Total Year 2** | **$3,204** | **$2,211** | **~$5,957** |

---

## Key Takeaways

### Must Budget For

1. **Apple Developer Account** - $99/year (non-negotiable for iOS)
2. **Google Play Console** - $25 one-time
3. **Legal basics** - At minimum, use free privacy policy generators
4. **Error buffer** - 10% on all API costs for failures/retries

### Can Defer

1. **Paid monitoring** - Use free tiers initially
2. **Paid support tools** - Email works fine early on
3. **Marketing spend** - Focus on word-of-mouth
4. **Security audits** - Not needed until you have users

### Watch Out For

1. **Copyright claims** - Have clear terms of service
2. **Voice cloning legal issues** - Stick to licensed/synthetic voices
3. **Scaling costs** - Monitor usage closely
4. **Rate limits** - Implement queuing early

---

## Updated Break-Even

| Metric | Original | With Hidden Costs |
|--------|----------|-------------------|
| Monthly fixed costs | $45 | $55-75 |
| Break-even subscribers | 7 | 9-12 |
| Still very achievable | ✅ | ✅ |

---

## Sources

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Google Play Console](https://play.google.com/console/)
- [Sentry Pricing](https://sentry.io/pricing/)
- [App Store Fees Guide](https://splitmetrics.com/blog/google-play-apple-app-store-fees/)

---

_Analysis generated: 2026-01-20_
