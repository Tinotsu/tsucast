---
project: tsucast
date: 2026-01-20
type: cost-prediction
author: Tino
---

# Cost Prediction Report: tsucast

_Financial projections based on architectural decisions made on 2026-01-20_

---

## Executive Summary

tsucast has been architected with cost optimization as a primary concern. Key cost-saving decisions:

1. **Public Audio Cache** - Same URL costs once, serves unlimited users
2. **Cloudflare R2** - Zero egress fees for audio serving
3. **Fish Audio** - 20x cheaper than ElevenLabs
4. **Free Tier Strategy** - Curated content only (near-zero marginal TTS cost)

**Break-even projection:** ~50 paid subscribers at $9.99/month

---

## Cost Components

### 1. TTS Provider (Fish Audio)

| Metric | Value |
|--------|-------|
| **Pricing** | $15 per 1M characters |
| **Average article** | ~11,000 characters |
| **Cost per article** | ~$0.165 |
| **Cost per audio minute** | ~$0.015 |

**Cost Scenarios:**

| Articles/Month | Characters | TTS Cost |
|----------------|------------|----------|
| 100 | 1.1M | $16.50 |
| 500 | 5.5M | $82.50 |
| 1,000 | 11M | $165.00 |
| 5,000 | 55M | $825.00 |
| 10,000 | 110M | $1,650.00 |

**Public Cache Impact:**

With public caching enabled, costs are dramatically reduced:

| Unique URLs | Cache Hit Rate | Actual Generations | TTS Cost |
|-------------|----------------|-------------------|----------|
| 1,000 | 0% (all new) | 1,000 | $165 |
| 1,000 | 50% | 500 | $82.50 |
| 1,000 | 80% | 200 | $33 |
| 1,000 | 95% (viral) | 50 | $8.25 |

**Estimate:** At scale with good cache hit rate (60-80%), expect ~$50-100/month TTS costs per 1,000 unique articles generated.

---

### 2. Supabase (Backend Platform)

**Pricing Tiers:**

| Plan | Cost | Includes |
|------|------|----------|
| **Free** | $0/mo | 500MB DB, 1GB storage, 50K MAUs |
| **Pro** | $25/mo + usage | 8GB DB, 100GB storage, 100K MAUs |
| **Team** | $599/mo | Pro + SOC2, SSO |

**Usage-Based Costs (Pro Plan):**

| Resource | Included | Overage Cost |
|----------|----------|--------------|
| Database | 8GB | $0.125/GB |
| Storage | 100GB | $0.021/GB |
| Egress | 250GB | $0.09/GB |
| Edge Function Invocations | 2M | $2/million |
| MAUs | 100K | $0.00325/MAU |

**Projected Costs by User Count:**

| Users | DB Size | Edge Calls | Plan | Est. Cost |
|-------|---------|------------|------|-----------|
| 0-1,000 | <500MB | <500K | Free | $0 |
| 1,000-5,000 | ~1GB | ~1M | Pro | $25-35 |
| 5,000-10,000 | ~2GB | ~3M | Pro | $35-50 |
| 10,000-50,000 | ~5GB | ~10M | Pro | $50-100 |
| 50,000+ | 10GB+ | 20M+ | Pro/Team | $100-250 |

---

### 3. Cloudflare R2 (Audio Storage)

**Pricing:**

| Resource | Free Tier | Paid |
|----------|-----------|------|
| Storage | 10GB/month | $0.015/GB |
| Class A ops (writes) | 1M/month | $4.50/million |
| Class B ops (reads) | 10M/month | $0.36/million |
| **Egress** | **Unlimited** | **$0 (FREE)** |

**Audio Storage Calculations:**

| Audio Quality | File Size (10 min) | Articles per 10GB |
|---------------|-------------------|-------------------|
| 64kbps MP3 | ~5MB | ~2,000 |
| 128kbps MP3 | ~10MB | ~1,000 |
| 192kbps AAC | ~15MB | ~666 |

**Projected Costs:**

| Articles Stored | Storage | Reads/Month | Monthly Cost |
|-----------------|---------|-------------|--------------|
| 1,000 | 10GB | 5M | $0 (free tier) |
| 5,000 | 50GB | 25M | $0.60 + $5.40 = ~$6 |
| 10,000 | 100GB | 100M | $1.35 + $32.40 = ~$34 |
| 50,000 | 500GB | 500M | $7.50 + $176 = ~$184 |

**Key Insight:** R2's zero egress fees save ~$0.09/GB compared to alternatives. At 100GB egress/month, that's $9 saved. At 1TB, that's $90 saved.

---

### 4. RevenueCat (Payments)

**Pricing:**

| MTR Range | Fee |
|-----------|-----|
| $0 - $2,500 | FREE |
| $2,500+ | 1% of MTR |

**MTR = Monthly Tracked Revenue** (gross, before App Store cut)

**Fee Projections:**

| Subscribers | Price | Gross MTR | RevenueCat Fee |
|-------------|-------|-----------|----------------|
| 100 | $9.99 | $999 | $0 (free) |
| 250 | $9.99 | $2,498 | $0 (free) |
| 251 | $9.99 | $2,508 | $25.08 |
| 500 | $9.99 | $4,995 | $49.95 |
| 1,000 | $9.99 | $9,990 | $99.90 |

---

### 5. EAS Build (Expo)

**Pricing:**

| Plan | Cost | Build Credits |
|------|------|---------------|
| **Free** | $0 | 30 builds/month (low priority) |
| **Starter** | $19/mo | More builds, faster |
| **Production** | $99/mo | Priority builds, concurrency |

**Build Frequency Estimate:**

| Phase | iOS Builds | Android Builds | Monthly Cost |
|-------|------------|----------------|--------------|
| Development | 10-20 | 10-20 | $0 (free tier) |
| Beta | 5-10 | 5-10 | $0-19 |
| Production | 2-4 | 2-4 | $0-19 |
| Scaling | 4-8 | 4-8 | $19-99 |

---

### 6. App Store Fees

| Platform | Commission | On $9.99 Sub |
|----------|------------|--------------|
| Apple (Year 1) | 30% | $3.00 |
| Apple (Year 2+) | 15% | $1.50 |
| Google (Year 1) | 30% | $3.00 |
| Google (Year 2+) | 15% | $1.50 |

**Net Revenue per $9.99 Subscription:**

| Year | Apple Cut | Google Cut | Net (avg) |
|------|-----------|------------|-----------|
| Year 1 | $6.99 | $6.99 | $6.99 |
| Year 2+ | $8.49 | $8.49 | $8.49 |

---

## Scenario Projections

### Scenario 1: Launch (0-6 months)

**Assumptions:**
- 500 free users, 50 paid subscribers
- 200 unique articles/month generated
- 60% cache hit rate

| Cost Category | Monthly Cost |
|---------------|--------------|
| Supabase | $0 (free tier) |
| Cloudflare R2 | $0 (free tier) |
| Fish Audio TTS | $13.20 (80 generations) |
| RevenueCat | $0 (under $2,500) |
| EAS Build | $0 (free tier) |
| **Total Costs** | **~$15/month** |

**Revenue:**
- 50 subscribers × $9.99 × 70% (after App Store) = **$349/month**

**Net Margin:** $334/month (96% margin)

---

### Scenario 2: Growth (6-12 months)

**Assumptions:**
- 5,000 free users, 500 paid subscribers
- 1,000 unique articles/month generated
- 70% cache hit rate

| Cost Category | Monthly Cost |
|---------------|--------------|
| Supabase Pro | $35 |
| Cloudflare R2 | $6 |
| Fish Audio TTS | $49.50 (300 generations) |
| RevenueCat | $49.95 (1% of $4,995) |
| EAS Build | $19 |
| **Total Costs** | **~$160/month** |

**Revenue:**
- 500 subscribers × $9.99 × 70% = **$3,497/month**

**Net Margin:** $3,337/month (95% margin)

---

### Scenario 3: Scale (12-24 months)

**Assumptions:**
- 50,000 free users, 5,000 paid subscribers
- 5,000 unique articles/month generated
- 80% cache hit rate

| Cost Category | Monthly Cost |
|---------------|--------------|
| Supabase Pro | $100 |
| Cloudflare R2 | $50 |
| Fish Audio TTS | $165 (1,000 generations) |
| RevenueCat | $499.50 (1% of $49,950) |
| EAS Build | $99 |
| **Total Costs** | **~$915/month** |

**Revenue:**
- 5,000 subscribers × $9.99 × 75% (Year 2) = **$37,463/month**

**Net Margin:** $36,548/month (98% margin)

---

### Scenario 4: YC Target (1,000 paid in 3 months)

**Assumptions:**
- 10,000 free users, 1,000 paid subscribers
- 2,000 unique articles/month
- 75% cache hit rate

| Cost Category | Monthly Cost |
|---------------|--------------|
| Supabase Pro | $50 |
| Cloudflare R2 | $15 |
| Fish Audio TTS | $82.50 (500 generations) |
| RevenueCat | $99.90 |
| EAS Build | $19 |
| **Total Costs** | **~$267/month** |

**Revenue:**
- 1,000 subscribers × $9.99 × 70% = **$6,993/month**

**Net Margin:** $6,726/month (96% margin)

---

## Cost Optimization Strategies

### Already Implemented (Architecture)

| Strategy | Savings |
|----------|---------|
| Public audio cache | 60-80% TTS cost reduction |
| Cloudflare R2 | $0 egress (vs $0.09/GB) |
| Fish Audio over ElevenLabs | 20x cheaper ($0.165 vs $3.30/article) |
| Free tier = curated content | Near-zero marginal TTS cost |

### Future Optimizations

| Strategy | Potential Savings |
|----------|-------------------|
| Article length limits (10K chars) | Cap worst-case TTS cost |
| R2 Infrequent Access for old audio | 33% storage savings |
| Self-hosted TTS (at scale) | Variable, complex |
| Batch TTS processing (off-peak) | Lower latency costs |

---

## Break-Even Analysis

**Fixed Costs (minimum viable):**

| Item | Monthly |
|------|---------|
| Supabase Pro | $25 |
| EAS Starter | $19 |
| Domain | ~$1 |
| **Total Fixed** | **$45/month** |

**Variable Costs per Paid User:**

| Item | Per User |
|------|----------|
| TTS (assumes 5 articles/user, 75% cache) | $0.21 |
| RevenueCat (1% over $2,500) | $0.10 |
| Storage/bandwidth | $0.02 |
| **Total Variable** | **~$0.33/user** |

**Revenue per User (after App Store):**
- $9.99 × 70% = $6.99/user

**Contribution Margin:** $6.99 - $0.33 = **$6.66/user**

**Break-Even Point:** $45 / $6.66 = **~7 subscribers**

(To cover RevenueCat's $2,500 threshold: ~250 subscribers)

---

## Risk Factors

### Cost Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Fish Audio price increase | Low | Cartesia as backup |
| Supabase usage spike | Medium | Monitor, set alerts |
| Low cache hit rate | Medium | Curate popular content |
| Viral article overwhelms TTS | Low | Queue + rate limiting |

### Revenue Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Low conversion rate | Medium | Focus on magic moment |
| High churn | Medium | Improve retention features |
| App Store rejection | Low | Follow guidelines |

---

## Summary

| Metric | Value |
|--------|-------|
| **Break-even** | ~7 subscribers |
| **Gross margin** | 95-98% at scale |
| **Cost per paid user** | ~$0.33/month |
| **Revenue per paid user** | ~$6.99/month (after stores) |
| **YC target costs** | ~$267/month for 1,000 subscribers |
| **YC target revenue** | ~$6,993/month |

**Key Insight:** The architecture is designed for exceptional unit economics. Public audio caching and zero-egress storage make this a high-margin SaaS business from day one.

---

## Sources

- [Supabase Pricing](https://supabase.com/pricing)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [RevenueCat Pricing](https://www.revenuecat.com/pricing/)
- [Expo EAS Pricing](https://expo.dev/pricing)
- Fish Audio: $15/1M characters (from architecture research)

---

_Report generated: 2026-01-20_
