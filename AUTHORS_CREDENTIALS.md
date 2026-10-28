# BookLeaf Publishing — Login Credentials Directory

This directory contains the login credentials for all **10 Authors** and **2 Operations Admins** seeded from `bookleaf_sample_data.json`.

> **Default Password for ALL Accounts:** `BookLeaf@123`

---

## 🛡️ Operations & Support Desk (Admin Accounts)

Use these accounts to access the **Admin Triage Queue**, view all incoming author tickets, inspect AI auto-classification and priority reasoning, edit AI-drafted responses, and write confidential internal notes.

| Name | Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **BookLeaf Ops Lead** | Super Admin | `admin@bookleaf.in` | `BookLeaf@123` | Full triage queue, SLA sort, priority overrides, internal notes, operations analytics. |
| **Royalty Specialist** | Support Admin | `support@bookleafpub.com` | `BookLeaf@123` | Ticket response drafting, author payouts & printing query resolution. |

---

## ✍️ Authors Directory (Author Dashboard Accounts)

Use these accounts to access the **Author Self-Publishing Portal**. Each author only sees their own published/in-production books, their own royalties, and their own tickets.

| Author ID | Author Name | City | Email | Password | Books Count & Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH001** | **Priya Sharma** | Mumbai | `priya.sharma@email.com` | `BookLeaf@123` | 2 Books (*Whispers of the Ganges*, *The Saffron Diaries*) — ₹3,570 Pending Royalty |
| **AUTH002** | **Rohit Kapoor** | Delhi | `rohit.kapoor@email.com` | `BookLeaf@123` | 2 Books (*Code & Karma*, *Startup Sutra*) — 2,000+ sold, ₹7,744 Pending |
| **AUTH003** | **Ananya Reddy** | Hyderabad | `ananya.reddy@email.com` | `BookLeaf@123` | 1 Book (*The Silicon Valley Dream*) — 0 Pending Payout |
| **AUTH004** | **Vikram Joshi** | Pune | `vikram.joshi@email.com` | `BookLeaf@123` | 2 Books (*Shadows of the Sahyadri*, *The Maratha Legacy*) |
| **AUTH005** | **Meera Patel** | Ahmedabad | `meera.patel@email.com` | `BookLeaf@123` | 2 Books (*Gujarati Kitchen Tales*, *Weave of Memories*) |
| **AUTH006** | **Arjun Nair** | Bengaluru | `arjun.nair@email.com` | `BookLeaf@123` | 2 Books (*Backwaters & Beyond*, *The Monsoon Bride*) |
| **AUTH007** | **Sunita Banerjee** | Kolkata | `sunita.banerjee@email.com` | `BookLeaf@123` | 2 Books (*Streets of Calcutta*, *Echoes of Tagore*) |
| **AUTH008** | **Kabir Mehta** | Chandigarh | `kabir.mehta@email.com` | `BookLeaf@123` | 2 Books (*The Borderline*, *Soldier's Pen*) |
| **AUTH009** | **Sneha Kulkarni** | Jaipur | `sneha.kulkarni@email.com` | `BookLeaf@123` | 1 Book (*Beyond the Horizon*) — **In Production (Cover Design stage)** |
| **AUTH010** | **Devendra Singh** | Lucknow | `devendra.singh@email.com` | `BookLeaf@123` | 2 Books (*The Awadh Odyssey*, *Ghazals of the Heart*) — **In Production (Manuscript Review)** |

---

## 🔒 Security & Role-Based Access Enforced

1. **Authentication:** Every login generates a secure JSON Web Token (JWT) signed with `JWT_SECRET`.
2. **Account Isolation:** When an author logs in, the backend Express API isolates their data. Author `AUTH001` cannot read books or tickets belonging to `AUTH002`.
3. **No Direct Switching:** Accounts cannot be swapped inside the portal without logging out. Click the **Log Out** button (`LogOut` icon) in the top-right navbar to return to the sign-in screen.
4. **Confidential Admin Notes:** Internal notes added by admins on any ticket are strictly sanitized and never returned to the author in any API response.
