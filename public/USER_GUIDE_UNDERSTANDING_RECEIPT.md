# User Guide: Understanding Your Voting Receipt

## Overview

After successfully casting your vote, you receive a PDF receipt. This guide explains every element of your voting receipt and how to use it for verification.

## Receipt Components

### 1. Header Section

**SmartVote Logo & Title**
- Official branding
- "VOTING RECEIPT" title
- Government seal/emblem

### 2. Voter Information

**Voter ID**
- Format: VOTE123456
- Your unique identifier
- Used for authentication only
- NOT linked to your vote choice

**Timestamp**
- Date and time of vote
- Format: DD/MM/YYYY HH:MM:SS
- Timezone: Local time
- Exact moment vote was cast

### 3. Blockchain Information

**Transaction Hash (TX Hash)**
```
0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
```

This is your **proof of vote**:
- Unique 66-character hexadecimal string
- Starts with "0x"
- Permanently recorded on blockchain
- Cannot be altered or deleted
- Use this to verify your vote

**Block Number**
- Example: Block #412
- The blockchain block containing your vote
- Sequential numbering
- Helps locate your transaction

**Network**
- Ganache Local Blockchain
- Or Ethereum Mainnet (if deployed)
- Network where vote is stored

### 4. Confirmation Status

**Status Indicators:**
- ✅ **Confirmed**: Vote successfully recorded
- ⏳ **Pending**: Transaction being processed
- ❌ **Failed**: Transaction failed (rare)

**Confirmations**
- Number of blocks after yours
- More confirmations = more secure
- Usually instant on Ganache

### 5. QR Code

**What it contains:**
- Your Transaction Hash
- Voter ID
- Timestamp
- Verification URL

**How to use:**
- Scan with smartphone
- Instantly verify on blockchain
- Quick access to transaction details

### 6. Security Notice

**Important Information:**
- Vote is anonymous
- Receipt does NOT show your candidate choice
- Keep receipt private
- Do not share TX Hash publicly

### 7. Footer

**Legal Text:**
- Election commission details
- Contact information
- Legal disclaimers
- Copyright notice

## How to Read Your Receipt

### Example Receipt Breakdown

```
╔════════════════════════════════════════╗
║     SMARTVOTE VOTING RECEIPT          ║
║     Blockchain-Verified Vote          ║
╠════════════════════════════════════════╣
║                                        ║
║  Voter ID: VOTE789012                 ║
║  Date: 15/03/2026                     ║
║  Time: 14:35:22                       ║
║                                        ║
║  Transaction Hash:                     ║
║  0x7f3a9b2c8d1e4f6a5b9c0d2e3f4a5b6c  ║
║                                        ║
║  Block Number: #1,247                 ║
║  Status: ✅ CONFIRMED                 ║
║  Confirmations: 6                     ║
║                                        ║
║  [QR CODE]                            ║
║                                        ║
║  Your vote has been securely recorded ║
║  on the blockchain. This receipt is   ║
║  your proof of participation.         ║
║                                        ║
╚════════════════════════════════════════╝
```

## Verification Process

### Step 1: Locate Your TX Hash

Find the Transaction Hash on your receipt:
- Long hexadecimal string
- Starts with "0x"
- 66 characters total

### Step 2: Access Blockchain Explorer

**Option A: SmartVote Portal**
1. Go to homepage
2. Click "View Results"
3. Navigate to "Blockchain History" tab
4. Paste your TX Hash in search

**Option B: QR Code**
1. Open camera app on phone
2. Scan QR code on receipt
3. Automatically opens verification page

### Step 3: Verify Transaction Details

Check the following match your receipt:
- ✅ Transaction Hash
- ✅ Block Number
- ✅ Timestamp
- ✅ Status (Confirmed)

### Step 4: Confirm Anonymity

Verify that:
- ❌ Your name is NOT visible
- ❌ Your candidate choice is NOT visible
- ✅ Only anonymous voter hash shown
- ✅ Vote count incremented

## What Your Receipt Proves

### ✅ What It DOES Prove

1. **You Voted**
   - Timestamp proves when you voted
   - TX Hash proves vote was recorded
   - Block number shows where it's stored

2. **Vote is Immutable**
   - Blockchain record cannot be changed
   - Cryptographically secured
   - Permanent proof

3. **Vote Was Counted**
   - Transaction confirmed
   - Included in final tally
   - Verifiable by anyone

### ❌ What It DOES NOT Prove

1. **Your Candidate Choice**
   - Receipt is anonymous
   - No link between you and your vote
   - Privacy protected

2. **Other Voters' Choices**
   - Cannot see how others voted
   - Aggregate results only
   - Individual votes are secret

## Security & Privacy

### Why Receipts Are Important

**Transparency**
- Proves your vote was counted
- Enables independent verification
- Builds trust in system

**Accountability**
- Election commission can be audited
- No votes can be "lost"
- Tampering is impossible

**Privacy**
- Your choice remains secret
- Only you know who you voted for
- Coercion-resistant

### Best Practices

**DO:**
- ✅ Save receipt securely
- ✅ Verify on blockchain
- ✅ Keep TX Hash private
- ✅ Report any discrepancies

**DON'T:**
- ❌ Share receipt publicly
- ❌ Post TX Hash on social media
- ❌ Sell or trade your receipt
- ❌ Use receipt to prove your vote choice

## Common Questions

### Q: Can I verify my vote anytime?

**A:** Yes! Your vote is permanently on the blockchain. You can verify it:
- Immediately after voting
- Days or weeks later
- Even years later
- Blockchain is permanent

### Q: Does my receipt show who I voted for?

**A:** No. Your receipt only proves:
- You voted
- When you voted
- Your vote was recorded

It does NOT show your candidate choice. This protects your privacy.

### Q: What if I lose my receipt?

**A:** Your vote is still counted! The receipt is for your records only. However:
- You won't be able to verify your specific transaction
- Your vote is still on the blockchain
- Results are not affected

### Q: Can someone else use my receipt?

**A:** No. The receipt is just proof of YOUR vote. It cannot:
- Be used to vote again
- Change your vote
- Reveal your choice
- Affect the election

### Q: What if my TX Hash doesn't work?

**A:** Possible reasons:
1. **Typo**: Double-check you copied it correctly
2. **Network delay**: Wait a few minutes and try again
3. **Wrong network**: Ensure you're checking the correct blockchain
4. **System error**: Contact support with your Voter ID

### Q: Is my receipt legally binding?

**A:** Yes, in the sense that:
- It proves you participated
- It's admissible as evidence
- It shows vote was recorded

However, it does NOT prove:
- Who you voted for
- How you should have voted
- Any obligation to vote a certain way

## Troubleshooting

### Receipt Not Downloaded

**Problem**: PDF didn't download automatically

**Solutions:**
- Check browser downloads folder
- Check if pop-ups are blocked
- Try different browser
- Request receipt again from admin

### Cannot Read QR Code

**Problem**: QR scanner can't read code

**Solutions:**
- Ensure good lighting
- Hold phone steady
- Try different QR scanner app
- Manually enter TX Hash instead

### TX Hash Not Found

**Problem**: Blockchain explorer can't find transaction

**Solutions:**
- Wait 1-2 minutes for confirmation
- Check you copied full hash (66 characters)
- Verify you're on correct network
- Contact support if persistent

### Receipt Shows Wrong Information

**Problem**: Details don't match your vote

**Solutions:**
- Verify you're looking at YOUR receipt
- Check timestamp matches when you voted
- Contact election support immediately
- Report discrepancy with Voter ID

## Additional Resources

### Blockchain Basics

**What is a blockchain?**
- Digital ledger of transactions
- Distributed across many computers
- Immutable (cannot be changed)
- Transparent and verifiable

**Why use blockchain for voting?**
- Prevents vote tampering
- Enables independent verification
- Eliminates central point of failure
- Increases trust and transparency

### Smart Contracts

**What is a smart contract?**
- Self-executing code on blockchain
- Automatically counts votes
- No human intervention needed
- Transparent and auditable

**How it protects your vote:**
- Rules are coded and unchangeable
- No one can manipulate the count
- Results are mathematically certain
- Audit trail is permanent

## Need Help?

If you have questions about your receipt:

**Email Support**
- support@smartvote.gov
- Include your Voter ID (NOT TX Hash)
- Describe your issue clearly

**Phone Support**
- 1800-XXX-XXXX
- Available during election period
- Have your receipt ready

**In-Person Support**
- Visit election commission office
- Bring printed receipt
- Bring valid ID

## Legal Notice

This receipt is issued by the Election Commission under the authority of the Digital Voting Act. It serves as proof of participation in the election but does not reveal your vote choice. Unauthorized use, duplication, or sale of this receipt is prohibited by law.

---

**Keep this receipt safe. It's your proof that democracy works!**
