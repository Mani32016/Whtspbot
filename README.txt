=============================================
PAKISTAN WELFARE SOCIETY - WHATSAPP BOT
VERSION 8.0 - FIXED GROUP MENTION DELETE
=============================================

KYA FIX HUA?
------------
Pehle jab group mention hota tha (@group tag)
to message delete nahi ho raha tha.

Ab har message type ko handle kiya gaya hai:
- Simple text ✅
- Extended text (mentions) ✅
- Image caption ✅
- Video caption ✅
- Document caption ✅

DEBUG MODE:
-----------
Ab logs mein har message ka type aur text
show hoga. Is se pata chalega ke message
properly read ho raha hai ya nahi.

Logs mein aise dikhega:
📩 [extendedTextMessage] From: 92xxxx
   Text: "Your status"

SETUP:
------
1. Purani files delete karke ye nayi upload karein
2. Render par deploy karein
3. QR scan karein
4. Test karein!

TEST:
-----
Group mein ye sab try karein:
- "status" → delete
- "your status" → delete
- "your status" + group mention → delete

SUPPORT:
--------
Pakistan Welfare Society
Blood Request Form: https://bloodrequest.netlify.app/

=============================================