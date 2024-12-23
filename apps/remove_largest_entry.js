const fs = require('fs');

function removeLargeEntries(filePath, maxSize = 1000) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    if (!Array.isArray(jsonData)) {
      console.log('JSON data is not an array. No changes made.');
      return;
    }

    const filteredData = jsonData.filter(entry => {
        const entryString = JSON.stringify(entry);
        return entryString.length <= maxSize;
    });

    if (filteredData.length !== jsonData.length) {
        fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
        console.log(`Removed entries larger than ${maxSize} characters from:`, filePath);
    } else {
        console.log('No entries larger than', maxSize, 'characters found in:', filePath);
    }


  } catch (error) {
    console.error('Error processing file:', filePath, error);
  }
}

const filePaths = process.argv.slice(2);
filePaths.forEach(filePath => removeLargeEntries(filePath));
