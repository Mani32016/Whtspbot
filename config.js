// Pakistan Welfare Society Bot Configuration
module.exports = {
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

    statusKeywords: [
        'status', 'stetus', 'statis', 'ستیٹس', 'اسٹیٹس',
        'mera status', 'apna status', 'status lagaya',
        'status daikho', 'status check', 'status dekh',
        'status dalna', 'status share', 'my status',
        'see my status', 'check status', 'status dikhana',
        'status bhejo', 'status bhejna'
    ],

    bloodFormLink: 'https://bloodrequest.netlify.app/',

    bloodReplyMessage: `🩸 *Pakistan Welfare Society - Blood Request* 🩸

Assalam-o-Alaikum!

Aap ne blood request ki hai. Barah-e-karam neechay diye gaye link se form fill karein:

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

    statusWarningMessage: `⚠️ *Group Alert* ⚠️

Status mention karna iss group mein *sakht mana* hai.
Mehfuz mahol banaye rakhen. Shukriya! 🤝`
};