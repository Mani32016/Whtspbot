=============================================
PAKISTAN WELFARE SOCIETY - WHATSAPP BOT
VERSION 9.0 - ULTIMATE FIX
=============================================

YE VERSION KYUN?
----------------
Jab "Your status" + group mention karte the
to message delete nahi ho raha tha.

Is version mein ULTIMATE text extraction hai:
1. Normal text fields check karta hai
2. Quoted messages check karta hai
3. POORI message object ko JSON mein convert karke
   har jagah "text" aur "caption" dhoondhta hai
4. Special message types bhi handle karta hai

Iska matlab: Chahe message ka type kuch bhi ho,
agar usme "status" likha hai, to bot PAKDEGA!

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
- "your status" + group mention → delete
- Kisi ka status forward karein → delete

DEBUG:
------
Logs mein ab ye dikhega:
📩 From: 92xxxx
   Full Text: "your status you mentioned this group"
   Message types: extendedTextMessage, ...

SUPPORT:
--------
Pakistan Welfare Society
Blood Request Form: https://bloodrequest.netlify.app/

=============================================