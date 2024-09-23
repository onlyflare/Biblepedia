const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

let bibleDataKJV = {};
let bibleDataACF = {};
let bibleDataRVR = {};
let languageData = {};

function loadBibleDataKJV() {
    const directoryPath = path.join(__dirname, '../../data/bible-kjv');
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const bookName = file.replace('.json', '');
            bibleDataKJV[bookName] = require(path.join(directoryPath, file));
        }
    });
}
function loadBibleDataACF() {
    const directoryPath = path.join(__dirname, '../../data/bible-acf');
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const bookName = file.replace('.json', '');
            bibleDataACF[bookName] = require(path.join(directoryPath, file));
        }
    });
}
function loadBibleDataRVR() {
    const directoryPath = path.join(__dirname, '../../data/bible-rvr');
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const bookName = file.replace('.json', '');
            bibleDataRVR[bookName] = require(path.join(directoryPath, file));
        }
    });
}

function loadLanguageData() {
    const languageFilePath = path.join(__dirname, '../../data/language.json');
    if (fs.existsSync(languageFilePath)) {
        languageData = require(languageFilePath);
    }
}

loadBibleDataKJV();
loadBibleDataACF();
loadBibleDataRVR();
loadLanguageData();

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
                .setRequired(false))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Choose your language')
                .setRequired(false)
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Português', value: 'pt' },
                    { name: 'Español', value: 'es' }
                )

        ),
    async execute(interaction) {
        const language = interaction.options.getString('language') || 'en';
        const selectedLanguage = languageData[language];
        if (!selectedLanguage) {
            lang = languageData['en'];
        } else {
            lang = selectedLanguage;
        }

        const checkJsonFile = (bookNameInput) => {
            return fs.existsSync(path.join(__dirname, `../../data/${lang.folder}/${bookNameInput}.json`));
        };

        const formattedOldTestamentBooks = lang.oldTestamentBooks.map(book => `\`${book}\``).join(', ');
        const formattedNewTestamentBooks = lang.newTestamentBooks.map(book => `\`${book}\``).join(', ');

        const listNumbers = (length) => Array.from({ length }, (_, i) => `\`${i + 1}\``);

        const defaultColor = '#CDB800';

        const bookInput = interaction.options.getString('book');
        const chapterInput = interaction.options.getInteger('chapter');
        const verseInput = interaction.options.getInteger('verse');

        if (!bookInput) {
            const searchEmbed = new EmbedBuilder()
                .setColor(defaultColor)
                .setAuthor({ name: 'Biblepedia', iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                .setTitle(lang.title)
                .setDescription(lang.description)
                .addFields(
                    { name: '\u200B', value: '\u200B' },
                    { name: lang.oldTestament, value: formattedOldTestamentBooks },
                    { name: lang.newTestament, value: formattedNewTestamentBooks },
                )
                .setThumbnail(`${interaction.client.user.avatarURL()}`)
                .setTimestamp()
                .setFooter({ text: lang.title, iconURL: `${interaction.user.displayAvatarURL()}` });
            await interaction.reply({ embeds: [searchEmbed] });
            return;
        }

        const noSpaceBookName = bookInput.replaceAll(' ', '').toLowerCase();
        if (!checkJsonFile(noSpaceBookName)) {
            await interaction.reply(`${lang.noBookFound} \`${bookInput}\` ${lang.inTheBible}!\n\n${lang.useSearchAgain}`);
            return;
        }

        const bibleDataToUse =
            lang.version === 'KJV' ? bibleDataKJV :
                lang.version === 'ACF' ? bibleDataACF :
                    bibleDataRVR;

        const { book, title, chapters } = bibleDataToUse[noSpaceBookName];

        const selectedChapter = chapters[chapterInput - 1];

        //Book, Chapter
        if (chapterInput && !verseInput) {
            if (chapterInput > chapters.length || chapterInput < 1) {
                await interaction.reply(`\`${book}\` ${lang.hasOnly} \`${chapters.length}\` ${lang.chapters}!`)
                return;
            }
            const versesEmbed = new EmbedBuilder()
                .setColor(defaultColor)
                .setAuthor({ name: title, iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                .setTitle(book)
                .addFields(
                    { name: lang.chapter, value: `\`${chapterInput}\`` },
                    { name: lang.verses, value: listNumbers(selectedChapter.verses.length).join(', ') }
                )
                .setThumbnail(`${interaction.client.user.avatarURL()}`)
                .setTimestamp()
                .setFooter({ text: lang.title, iconURL: `${interaction.user.displayAvatarURL()}` });

            await interaction.reply({ embeds: [versesEmbed] });
            return;
        }

        //Book, Chapter, Verse
        if (chapterInput && verseInput) {
            if (chapterInput > chapters.length || chapterInput < 1) {
                await interaction.reply(`\`${book}\` ${lang.hasOnly} \`${chapters.length}\` ${lang.chapters}!`)
                return;
            }
            if (verseInput > selectedChapter.verses.length || verseInput < 1) {
                await interaction.reply(`${lang.chapter} \`${chapterInput}\` ${lang.ofBook} \`${book}\` ${lang.hasOnly} \`${selectedChapter.verses.length}\` ${lang.verses}!`)
                return;
            }
            const textEmbed = new EmbedBuilder()
                .setColor(defaultColor)
                .setAuthor({ name: title, iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                .setTitle(book)
                .addFields(
                    { name: lang.chapter, value: `\`${chapterInput}\`` },
                    { name: lang.verse, value: `\`${verseInput}\`` },
                    { name: lang.text, value: `${selectedChapter.verses[verseInput - 1].text}` }
                )
                .setThumbnail(`${interaction.client.user.avatarURL()}`)
                .setTimestamp()
                .setFooter({ text: lang.title, iconURL: `${interaction.user.displayAvatarURL()}` });

            await interaction.reply({ embeds: [textEmbed] });
            return;
        }

        //Book
        if (bookInput) {
            const chaptersEmbed = new EmbedBuilder()
                .setColor(defaultColor)
                .setAuthor({ name: title, iconURL: 'https://i.ibb.co/2j6JRBR/image.png' })
                .setTitle(book)
                .addFields(
                    { name: lang.chapter, value: listNumbers(chapters.length).join(', ') },
                )
                .setThumbnail(`${interaction.client.user.avatarURL()}`)
                .setTimestamp()
                .setFooter({ text: lang.title, iconURL: `${interaction.user.displayAvatarURL()}` });

            await interaction.reply({ embeds: [chaptersEmbed] });
            return;
        }

    }

};

