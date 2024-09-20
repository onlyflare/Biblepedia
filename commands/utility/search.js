const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

//Caching all Bible books
let bibleData = {};

//Function to load all books synchronously
function loadBibleData() {
    const directoryPath = path.join(__dirname, 'bible-kjv');
    const files = fs.readdirSync(directoryPath); // Synchronous read
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const bookName = file.replace('.json', '');
            bibleData[bookName] = require(path.join(directoryPath, file));
        }
    });
}

//Call the function to load data at the start
loadBibleData();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search in the Bible for books, chapters or verses')
        .addStringOption(option =>
            option.setName('book')
                .setDescription('The book')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('chapter')
                .setDescription('The chapter')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('verse')
                .setDescription('The verse')
                .setRequired(false)),

        async execute(interaction) {

            //Function to check if the file/book exists or is spelled correct
            function checkJsonFile(bookNameInput) { 
                return fs.existsSync(`commands/utility/bible-kjv/${bookNameInput}.json`);
            }

            //Books and formats
            const oldTestamentBooks = [
                "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
                "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
                "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
                "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
                "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
                "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
                "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
                "Zephaniah", "Haggai", "Zechariah", "Malachi"
            ];
            const newTestamentBooks = [
                "Matthew", "Mark", "Luke", "John", "Acts",
                "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
                "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
                "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
                "James", "1 Peter", "2 Peter", "1 John", "2 John",
                "3 John", "Jude", "Revelation"
            ];
            const formattedOldTestamentBooks = oldTestamentBooks.map(book => `\`${book}\``).join(', ');
            const formattedNewTestamentBooks = newTestamentBooks.map(book => `\`${book}\``).join(', ');

            //Generate a list of numbers from 1 to chapters/verses.length with backticks
            const listNumbers = (length) => Array.from({ length }, (_, i) => `\`${i + 1}\``);

            //Consts
            const defaultColor = '#CDB800';

            //User inputs
            const bookInput = interaction.options.getString('book');
            const chapterInput = interaction.options.getInteger('chapter');
            const verseInput = interaction.options.getInteger('verse');
            
            //Send a summary of the Bible if there is no 'book' input
            if (!bookInput) {
                const searchEmbed = new EmbedBuilder()
                    .setColor(defaultColor)
                    .setAuthor({ name: 'Biblepedia', iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                    .setTitle('King James Bible')
                    .setURL('https://www.kingjamesbibleonline.org/')
                    .setDescription('The Preserved and Living Word of God')
                    .addFields(
                        { name: '\u200B', value: '\u200B' },                             
                        { name: 'Old Testament', value: formattedOldTestamentBooks},                   
                        { name: 'New Testament', value: formattedNewTestamentBooks},
                    )
                    .setThumbnail(`${interaction.client.user.avatarURL()}`)
                    .setTimestamp()
                    .setFooter({ text: '1611 - King James Version', iconURL: `${interaction.user.displayAvatarURL()}` });
    
                await interaction.reply({ embeds: [searchEmbed] });
                return;
            }

            //Checks if book name exists
            const noSpaceBookName = bookInput.replaceAll(' ', '').toLowerCase();
            if (!checkJsonFile(noSpaceBookName)) {
                await interaction.reply(`There is no book named \`${bookInput}\` in the Bible!\n\nUse \`/search\` again without any arguments to see all the books.`);
                return;
            }

             //Get info from JSON files
            const { book, title, chapters } = bibleData[noSpaceBookName]
            const selectedChapter = chapters[chapterInput-1];

            //Reply if args = Book, Chapter
            if (chapterInput && !verseInput) {
                if (chapterInput>chapters.length || chapterInput<1) {
                    await interaction.reply(`\`${book}\` has only \`${chapters.length}\` chapters!`)
                    return;
                }
                const versesEmbed = new EmbedBuilder()
                .setColor(defaultColor)
                .setAuthor({ name: title, iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                .setTitle(book)
                .addFields(                            
                    { name: 'Chapter', value: `\`${chapterInput}\``},
                    { name: 'Verses', value: listNumbers(selectedChapter.verses.length).join(', ')}
                )
                .setThumbnail(`${interaction.client.user.avatarURL()}`)
                .setTimestamp()
                .setFooter({ text: '1611 - King James Version', iconURL: `${interaction.user.displayAvatarURL()}` });
    
                await interaction.reply({ embeds: [versesEmbed] });
                return;
            }

            //Reply if args = Book, Chapter, Verse
            if (chapterInput && verseInput) {
                if (chapterInput>chapters.length || chapterInput<1) {
                    await interaction.reply(`\`${book}\` has only \`${chapters.length}\` chapters!`)
                    return;
                }
                if (verseInput>selectedChapter.verses.length || verseInput<1) {
                    await interaction.reply(`Chapter \`${chapterInput}\` of \`${book}\` has only \`${selectedChapter.verses.length}\` verses!`)
                    return;
                }
                const textEmbed = new EmbedBuilder()
                .setColor(defaultColor)
                .setAuthor({ name: title, iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                .setTitle(book)
                .addFields(                            
                    { name: 'Chapter', value: `\`${chapterInput}\``},
                    { name: 'Verse', value: `\`${verseInput}\``},
                    { name: 'Text', value: `${selectedChapter.verses[verseInput-1].text}`}
                )
                .setThumbnail(`${interaction.client.user.avatarURL()}`)
                .setTimestamp()
                .setFooter({ text: '1611 - King James Version', iconURL: `${interaction.user.displayAvatarURL()}` });
    
                await interaction.reply({ embeds: [textEmbed] });
                return;
            }

            //Reply if args = Book
            if (bookInput) {
                const chaptersEmbed = new EmbedBuilder()
                .setColor(defaultColor)
                .setAuthor({ name: title, iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                .setTitle(book)
                .addFields(                            
                    { name: 'Chapters', value: listNumbers(chapters.length).join(', ')},
                )
                .setThumbnail(`${interaction.client.user.avatarURL()}`)
                .setTimestamp()
                .setFooter({ text: '1611 - King James Version', iconURL: `${interaction.user.displayAvatarURL()}` });
    
                await interaction.reply({ embeds: [chaptersEmbed] });
                return;
            }

        }

};

