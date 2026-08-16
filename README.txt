=============================================
PAKISTAN WELFARE SOCIETY - WHATSAPP BOT
VERSION 11.0 - REAL FIX (groupStatusMentionMessage)
=============================================

ASLI MASLA KYA THA?
-------------------
Jab "Your status" + group mention karte the,
to message ka type "groupStatusMentionMessage" hota tha.

Is type mein koi "text" field nahi hoti!
Isliye bot "status" word detect nahi kar pa raha tha.

REAL FIX:
---------
Ab bot 2 cheezein check karta hai:

1. Agar message type "groupStatusMentionMessage" hai
   → AUTO DELETE (kyun ke ye by definition status mention hai)

2. Agar normal text mein "status" word hai
   → AUTO DELETE

LOGS:
-----
Ab logs mein ye dikhega:
📩 From: 92xxxx
   Types: messageContextInfo, groupStatusMentionMessage
   Text: ""
🚨 STATUS MENTION DETECTED! Deleting...
   ✅ DELETED!

SETUP:
------
1. Purani files delete karke ye nayi upload karein
2. Render par deploy karein
3. QR scan karein
4. Test karein!

TEST:
-----
- "status" → delete
- "your status" → delete
- "your status" + group mention → delete (YE AB CHALEGA!)

SUPPORT:
--------
Pakistan Welfare Society
Blood Request Form: https://bloodrequest.netlify.app/

=============================================