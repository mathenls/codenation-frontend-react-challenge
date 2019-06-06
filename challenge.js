const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');
const FormData = require('form-data');

isLetter = (str) => {
    return str.length === 1 && str.match(/[a-z]/i);
}

decipherByAlphabetOffsetNumber = (ciphedString, alphabetOffset) => {
    return ciphedString
        .split('')
        .map((char, index) => {
            let charCode = char.charCodeAt(0) - alphabetOffset;
            if (charCode < 97) {
                charCode = charCode + 26;
            }
            return isLetter(char) ? String.fromCharCode(charCode) : char
        })
        .join('')
}

saveJsonFile = (filename, content) => {
    fs.writeFileSync(`./${filename}`, content, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

readJsonFile = (filename) => {
    const rawText = fs.readFileSync(`./${filename}`);
    const jsonData = JSON.parse(rawText);
    return jsonData;
}

readJsonFileToReadStream = (filename) => {
    if (filename.split('.')[1] === 'json') {
        return fs.createReadStream(`./${filename}`);
    } else {
        throw new Error('You need to input a JSON file');
    }
}

fetchDataFromAPI = async (url, token) => {
    const responsePromise = await fetch(`${url}?token=${token}`);
    const response = await responsePromise.json();
    return response;
}

createFormDataFromObject = (formObject) => {
    const formData = new FormData();
    Object.keys(formObject).forEach((key) => {
        formData.append(key, formObject[key])
    });
    return formData;
}

postFileStreamToAPI = async (url, token, formData) => {
    const responseBody = await fetch(`${url}?token=${token}`, {
        method: 'POST',
        body: formData
    })
    const response = await responseBody.json();
    return response;
}

runMainTask = async () => {
    const getDataURL = 'https://api.codenation.dev/v1/challenge/dev-ps/generate-data';
    const token = '40f2b8cae2ef114acf2aae46e98883bf0d01e2b6';
    const postDataURL = 'https://api.codenation.dev/v1/challenge/dev-ps/submit-solution';

    const initialChallengeData = await fetchDataFromAPI(getDataURL, token);
    saveJsonFile('answer.json', JSON.stringify(initialChallengeData));

    const deciphedText = decipherByAlphabetOffsetNumber(initialChallengeData.cifrado, initialChallengeData.numero_casas);
    const sha1Text = crypto.createHash('sha1').update(deciphedText.toLowerCase()).digest('hex');
    const solvedChallengeData = {
        ...initialChallengeData,
        decifrado: deciphedText,
        resumo_criptografico: sha1Text
    }
    saveJsonFile('answer.json', JSON.stringify(solvedChallengeData));

    const challengeResponseRequestBody = {
        answer: readJsonFileToReadStream('answer.json')
    }
    const formData = createFormDataFromObject(challengeResponseRequestBody);
    const challengeResultResponse = await postFileStreamToAPI(postDataURL, token, formData);
    console.log(challengeResultResponse);
}

runMainTask()