import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input path
const inputPath = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');

// Helper function to safely get nested property
const getNestedValue = (obj, path) => {
    try {
        return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    } catch (e) {
        return '';
    }
};

// Helper function to check if a site is gold-related
const isGoldSite = (site) => {
    // Check primary commodities
    const hasGoldCommodity = site.commodities?.some(c => 
        c.name?.toLowerCase() === 'gold' || 
        c.code?.toLowerCase() === 'au'
    );
    if (hasGoldCommodity) return true;

    // Check comments for gold mentions
    const comments = site.metadata?.comments || [];
    const hasGoldInComments = comments.some(c => 
        c.text?.toLowerCase().includes('gold') ||
        c.text?.toLowerCase().includes('au ')
    );
    if (hasGoldInComments) return true;

    // Check other fields
    const textFields = [
        site.deposit?.description,
        site.geology?.description,
        site.remarks
    ];
    return textFields.some(text => text?.toLowerCase().includes('gold'));
};

// Read and analyze the file
fs.readFile(inputPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const sites = JSON.parse(data);
        const goldSites = sites.filter(isGoldSite);

        // Collect different ways mines are categorized
        const stats = {
            depositTypes: new Map(),
            placerMentions: 0,
            lodeMentions: 0,
            veinMentions: 0,
            quartz: 0,
            depositStatus: new Map(),
            workingTypes: new Map()
        };

        // Keywords that might indicate lode deposits
        const lodeKeywords = [
            'lode', 'vein', 'quartz', 'underground', 'shaft', 'adit', 'tunnel', 
            'stope', 'drift', 'hard rock', 'bedrock', 'ore shoot', 'mineralized zone'
        ];

        // Keywords that might indicate placer deposits
        const placerKeywords = [
            'placer', 'alluvial', 'stream', 'gravel', 'hydraulic', 'dredge',
            'sand', 'wash', 'creek', 'river', 'terrace', 'bench'
        ];

        goldSites.forEach(site => {
            // Collect deposit types
            const depositType = getNestedValue(site, 'deposit.type');
            if (depositType) {
                stats.depositTypes.set(
                    depositType, 
                    (stats.depositTypes.get(depositType) || 0) + 1
                );
            }

            // Collect deposit status
            const status = getNestedValue(site, 'deposit.status');
            if (status) {
                stats.depositStatus.set(
                    status,
                    (stats.depositStatus.get(status) || 0) + 1
                );
            }

            // Collect working types
            if (Array.isArray(site.workings)) {
                site.workings.forEach(working => {
                    if (working.type) {
                        stats.workingTypes.set(
                            working.type,
                            (stats.workingTypes.get(working.type) || 0) + 1
                        );
                    }
                });
            }

            // Analyze all text fields for keywords
            const allText = [
                depositType,
                site.deposit?.description,
                site.geology?.description,
                site.remarks,
                ...(site.metadata?.comments || []).map(c => c.text)
            ].join(' ').toLowerCase();

            // Count keyword mentions
            if (allText.includes('placer')) stats.placerMentions++;
            if (allText.includes('lode')) stats.lodeMentions++;
            if (allText.includes('vein')) stats.veinMentions++;
            if (allText.includes('quartz')) stats.quartz++;
        });

        // Print analysis results
        console.log('\nGold Site Analysis Results:');
        console.log('=========================');
        console.log(`Total gold sites analyzed: ${goldSites.length}`);

        console.log('\nDeposit Types:');
        console.log('-------------');
        Array.from(stats.depositTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`${type}: ${count} sites (${((count/goldSites.length)*100).toFixed(2)}%)`);
            });

        console.log('\nDeposit Status:');
        console.log('--------------');
        Array.from(stats.depositStatus.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([status, count]) => {
                console.log(`${status}: ${count} sites (${((count/goldSites.length)*100).toFixed(2)}%)`);
            });

        console.log('\nWorking Types:');
        console.log('-------------');
        Array.from(stats.workingTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`${type}: ${count} sites (${((count/goldSites.length)*100).toFixed(2)}%)`);
            });

        console.log('\nKeyword Analysis:');
        console.log('----------------');
        console.log(`Placer mentions: ${stats.placerMentions} sites (${((stats.placerMentions/goldSites.length)*100).toFixed(2)}%)`);
        console.log(`Lode mentions: ${stats.lodeMentions} sites (${((stats.lodeMentions/goldSites.length)*100).toFixed(2)}%)`);
        console.log(`Vein mentions: ${stats.veinMentions} sites (${((stats.veinMentions/goldSites.length)*100).toFixed(2)}%)`);
        console.log(`Quartz mentions: ${stats.quartz} sites (${((stats.quartz/goldSites.length)*100).toFixed(2)}%)`);

        // Sample some sites for verification
        console.log('\nSample Sites:');
        console.log('------------');
        const samples = goldSites
            .filter(site => {
                const allText = [
                    getNestedValue(site, 'deposit.type'),
                    site.deposit?.description,
                    site.geology?.description,
                    site.remarks,
                    ...(site.metadata?.comments || []).map(c => c.text)
                ].join(' ').toLowerCase();
                return allText.includes('lode') || allText.includes('placer');
            })
            .slice(0, 3);

        samples.forEach(site => {
            console.log(`\nSite: ${site.name}`);
            console.log(`Deposit Type: ${getNestedValue(site, 'deposit.type')}`);
            console.log(`Description: ${site.deposit?.description || ''}`);
            if (site.metadata?.comments) {
                console.log('Comments:');
                site.metadata.comments.forEach(c => console.log(`- ${c.text}`));
            }
        });

    } catch (error) {
        console.error('Error analyzing data:', error);
    }
});
