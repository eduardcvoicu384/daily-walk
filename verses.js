// Scripture data.
// KJV text is public domain and built in.
// VDC and NTR are copyrighted, so their text is not included here. You paste it
// in from your own Bible app inside Daily Walk (Settings > Bible), and it is
// stored only on your device.

// Every verse the app uses. Keys are standard book.chapter.verse codes.
window.VERSES = {
  "1CO.10.13": { ref: "1 Corinthians 10:13", refRo: "1 Corinteni 10:13",
    kjv: "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it." },
  "JAS.4.7": { ref: "James 4:7", refRo: "Iacov 4:7",
    kjv: "Submit yourselves therefore to God. Resist the devil, and he will flee from you." },
  "MAT.26.41": { ref: "Matthew 26:41", refRo: "Matei 26:41",
    kjv: "Watch and pray, that ye enter not into temptation: the spirit indeed is willing, but the flesh is weak." },
  "HEB.4.15-16": { ref: "Hebrews 4:15–16", refRo: "Evrei 4:15–16",
    kjv: "For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin. Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need." },
  "PSA.46.1": { ref: "Psalm 46:1", refRo: "Psalmul 46:1",
    kjv: "God is our refuge and strength, a very present help in trouble." },
  "2CO.12.9": { ref: "2 Corinthians 12:9", refRo: "2 Corinteni 12:9",
    kjv: "And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me." },
  "GAL.5.1": { ref: "Galatians 5:1", refRo: "Galateni 5:1",
    kjv: "Stand fast therefore in the liberty wherewith Christ hath made us free, and be not entangled again with the yoke of bondage." },
  "2TI.1.7": { ref: "2 Timothy 1:7", refRo: "2 Timotei 1:7",
    kjv: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." },
  "1JN.1.9": { ref: "1 John 1:9", refRo: "1 Ioan 1:9",
    kjv: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness." },
  "LAM.3.22-23": { ref: "Lamentations 3:22–23", refRo: "Plângerile lui Ieremia 3:22–23",
    kjv: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness." },
  "PRO.24.16": { ref: "Proverbs 24:16", refRo: "Proverbele 24:16",
    kjv: "For a just man falleth seven times, and riseth up again: but the wicked shall fall into mischief." },
  "MIC.7.8": { ref: "Micah 7:8", refRo: "Mica 7:8",
    kjv: "Rejoice not against me, O mine enemy: when I fall, I shall arise; when I sit in darkness, the LORD shall be a light unto me." },
  "ROM.8.1": { ref: "Romans 8:1", refRo: "Romani 8:1",
    kjv: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit." },
  "PSA.51.10": { ref: "Psalm 51:10", refRo: "Psalmul 51:10",
    kjv: "Create in me a clean heart, O God; and renew a right spirit within me." },
  "PHP.4.13": { ref: "Philippians 4:13", refRo: "Filipeni 4:13",
    kjv: "I can do all things through Christ which strengtheneth me." },
  "ROM.12.2": { ref: "Romans 12:2", refRo: "Romani 12:2",
    kjv: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God." },
  "PSA.119.9": { ref: "Psalm 119:9", refRo: "Psalmul 119:9",
    kjv: "Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word." },
  "2CO.5.17": { ref: "2 Corinthians 5:17", refRo: "2 Corinteni 5:17",
    kjv: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." },
  "JHN.8.36": { ref: "John 8:36", refRo: "Ioan 8:36",
    kjv: "If the Son therefore shall make you free, ye shall be free indeed." },
  "ISA.40.31": { ref: "Isaiah 40:31", refRo: "Isaia 40:31",
    kjv: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  "1PE.5.7": { ref: "1 Peter 5:7", refRo: "1 Petru 5:7",
    kjv: "Casting all your care upon him; for he careth for you." },
  "PSA.101.3": { ref: "Psalm 101:3", refRo: "Psalmul 101:3",
    kjv: "I will set no wicked thing before mine eyes: I hate the work of them that turn aside; it shall not cleave to me." }
};

// YouVersion (bible.com) ids, used for the "Open in ..." links
window.BIBLES = {
  kjv: { name: "King James Version", short: "KJV", youversion: 1 },
  vdc: { name: "Versiunea Dumitru Cornilescu", short: "VDC", youversion: 191 },
  ntr: { name: "Noua Traducere Românească", short: "NTR", youversion: 126 }
};

// Shown on the rescue screen when an urge hits
window.TEMPTATION_VERSES = ["1CO.10.13", "JAS.4.7", "MAT.26.41", "HEB.4.15-16", "PSA.46.1", "2CO.12.9", "GAL.5.1", "2TI.1.7"];

// Shown after a slip
window.GRACE_VERSES = ["1JN.1.9", "LAM.3.22-23", "PRO.24.16", "MIC.7.8", "ROM.8.1"];

// Verse of the day (rotates daily)
window.DAILY_VERSES = ["PSA.51.10", "PHP.4.13", "ROM.12.2", "PSA.119.9", "2CO.5.17", "JHN.8.36", "ISA.40.31",
  "1PE.5.7", "PSA.101.3", "LAM.3.22-23", "GAL.5.1", "PSA.46.1", "2CO.12.9", "JAS.4.7"];

// Milestones (days) and the verse shown on that day
window.MILESTONES = [
  { days: 1, verse: "LAM.3.22-23" }, { days: 3, verse: "PSA.46.1" }, { days: 7, verse: "GAL.5.1" },
  { days: 14, verse: "PHP.4.13" }, { days: 21, verse: "ROM.12.2" }, { days: 30, verse: "2CO.5.17" },
  { days: 45, verse: "ISA.40.31" }, { days: 60, verse: "PSA.51.10" }, { days: 90, verse: "JHN.8.36" },
  { days: 120, verse: "2TI.1.7" }, { days: 180, verse: "PSA.119.9" }, { days: 270, verse: "JAS.4.7" },
  { days: 365, verse: "2CO.12.9" }, { days: 500, verse: "ISA.40.31" }, { days: 730, verse: "LAM.3.22-23" },
  { days: 1000, verse: "GAL.5.1" }
];

// Short prayers for the rescue screen (original text)
window.PRAYERS = [
  "Lord Jesus, I feel the pull right now. I don't want to go back. Give me the strength to walk away, and help me see the way of escape You promised.",
  "Father, I bring this urge to You instead of acting on it. Guard my eyes and my mind. I belong to You.",
  "Jesus, You were tempted too and You understand. Stand with me in this moment. Fill the emptiness I feel with Your presence.",
  "Holy Spirit, I am weak right now, but You are strong in me. Turn my heart back to what is good and true."
];

// Things to do instead, shown on the rescue screen
window.ESCAPE_ACTIONS = [
  "Leave the room you're in",
  "Put your phone in another room for 15 minutes",
  "Go outside and walk around the block",
  "Do 20 push-ups or squats",
  "Take a shower",
  "Read a Psalm out loud",
  "Put on worship music"
];
