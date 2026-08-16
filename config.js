// Pakistan Welfare Society Bot Configuration
// Edit this file to customize keywords and messages

module.exports = {
    // Blood related keywords (English + Urdu/Roman)
    bloodKeywords: [
        'blood', 'khoon', 'خون', 'بلڈ',
        'a+', 'a positive', 'a-', 'a negative',
        'b+', 'b positive', 'b-', 'b negative',
        'o+', 'o positive', 'o-', 'o negative',
        'ab+', 'ab positive', 'ab-', 'ab negative',
        'a پوزیٹو', 'b پوزیٹو', 'o پوزیٹو', 'ab پوزیٹو',
        'a نیگٹیو', 'b نیگٹیو', 'o نیگٹیو', 'ab نیگٹیو',
        'positive', 'negative', 'پوزیٹو', 'نیگٹیو',
        'need blood', 'blood chahiye', 'blood required',
        'donor', 'ڈونر', 'بلڈ چاہیے', 'خون چاہیے',
        'blood group', 'blood needed', 'blood urgent'
    ],

    // Status mention keywords (English + Urdu/Roman)
    statusKeywords: [
        'status', 'stetus', 'statis', 'ستیٹس', 'اسٹیٹس',
        'mera status', 'apna status', 'status lagaya',
        'status daikho', 'status check', 'status dekh',
        'status dalna', 'status share', 'my status',
        'see my status', 'check status', 'status dikhana',
        'status bhejo', 'status bhejna'
    ],

    // Your blood request form link
    bloodFormLink: 'https://bloodrequest.netlify.app/',

    // Auto-reply message for blood requests
    bloodReplyMessage: `🩸 *Pakistan Welfare Society - Blood Request* 🩸

Assalam-o-Alaikum! 

Aap ne blood request ki hai. Barah-e-karam neechay diye gaye link se form fill karein taake hum aapki madad kar saken:

🔗 *Form Link:*
https://bloodrequest.netlify.app/

📋 *Form mein yeh details den:*
• Patient ki tasveer
• Hospital ka naam aur location
• Blood group aur quantity
• Contact number
• Kitne baje tak chahiye?

*Note:* Fake requests se guraiz karein. JazakAllah! 🤲

_Powered by Pakistan Welfare Society_`,

    // Warning message when status is mentioned
    statusWarningMessage: `⚠️ *Group Alert* ⚠️

Status mention karna iss group mein *sakht mana* hai. 
Mehfuz mahol banaye rakhen. Shukriya! 🤝`
};