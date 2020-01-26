// ==UserScript==
// @name        MasterOfTheGrid
// @namespace   myerffoeg
// @version     1.0.1
// @author      Geoffrey Migliacci
// @description A MasterOfTheGrid simple cheat.
// @homepage    https://github.com/myerffoeg/masterofthegrid
// @icon        https://raw.githubusercontent.com/myerffoeg/masterofthegrid/master/MasterOfTheGrid.png
// @updateURL   https://raw.githubusercontent.com/myerffoeg/masterofthegrid/master/MasterOfTheGrid.user.js
// @supportURL  https://github.com/myerffoeg/masterofthegrid/issues
// @match       http://masterofthegrid.sparklinlabs.com/play/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js
// @run-at      document-idle
// @grant       none
// @noframes
// ==/UserScript==

if (localStorage.getItem('MasterOfTheGrid') === null) {
    $.ajax({
        method: 'GET',
        url: 'https://raw.githubusercontent.com/myerffoeg/masterofthegrid/master/fr-FR.json',
        cache: true,
        dataType: 'json',
        success: (references) => {
            localStorage.setItem('MasterOfTheGrid', JSON.stringify(references));
        }
    });
}

$(document).on('keypress', (e) => {
    if (channel.data) {
        if (e.which === 178) {
            const challenges = localStorage.getItem('MasterOfTheGrid') === null ? {} : JSON.parse(localStorage.getItem('MasterOfTheGrid'));

            channel.socket.on('challengeInProgress', () => {
                if (!challenges[channel.data.challenge.category]) {
                    challenges[channel.data.challenge.category] = {};
                }

                if (challenges[channel.data.challenge.category][channel.data.challenge.id]) {
                    if (['chooseMultiple', 'sort'].indexOf(channel.data.challenge.challengeType) !== -1) {
                        channel.socket.emit('setAnswer', challenges[channel.data.challenge.category][channel.data.challenge.id].answer.reduce((a, c) => {
                            a.push(channel.data.challenge.choices.indexOf(c));
                            return a;
                        }, []));
                    } else if (channel.data.challenge.challengeType === 'chooseOne') {
                        channel.socket.emit('setAnswer', channel.data.challenge.choices.indexOf(challenges[channel.data.challenge.category][channel.data.challenge.id].answer));
                    } else if (['trueOrFalse', 'estimate'].indexOf(channel.data.challenge.challengeType) !== -1) {
                        channel.socket.emit('setAnswer', challenges[channel.data.challenge.category][channel.data.challenge.id].answer);
                    } else if (channel.data.challenge.challengeType === 'map') {
                        channel.socket.emit('setAnswer', channel.data.challenge.choices.findIndex((a) => challenges[channel.data.challenge.category][channel.data.challenge.id].answer.x === a.x && challenges[channel.data.challenge.category][channel.data.challenge.id].answer.y === a.y));
                    }
                }
            });

            channel.socket.on('challengeAnswer', (challengeAnswer) => {
                if (!challenges[channel.data.challenge.category]) {
                    challenges[channel.data.challenge.category] = {};
                }

                if (!challenges[channel.data.challenge.category][channel.data.challenge.id]) {
                    if (['chooseMultiple', 'sort'].indexOf(channel.data.challenge.challengeType) !== -1) {
                        challenges[channel.data.challenge.category][channel.data.challenge.id] = {
                            challengeType: channel.data.challenge.challengeType,
                            answer: challengeAnswer.reduce((a, c) => {
                                a.push(channel.data.challenge.choices[c]);
                                return a;
                            }, [])
                        };
                    } else if (['map', 'chooseOne'].indexOf(channel.data.challenge.challengeType) !== -1) {
                        challenges[channel.data.challenge.category][channel.data.challenge.id] = {
                            challengeType: channel.data.challenge.challengeType,
                            answer: channel.data.challenge.choices[challengeAnswer]
                        };
                    } else if (channel.data.challenge.challengeType === 'estimate') {
                        challenges[channel.data.challenge.category][channel.data.challenge.id] = {
                            challengeType: channel.data.challenge.challengeType,
                            answer: challengeAnswer.minimumValue === challengeAnswer.maximumValue ? challengeAnswer.minimumValue : Math.floor((challengeAnswer.minimumValue + challengeAnswer.maximumValue) / 2)
                        };
                    } else if (channel.data.challenge.challengeType === 'trueOrFalse') {
                        challenges[channel.data.challenge.category][channel.data.challenge.id] = {
                            challengeType: channel.data.challenge.challengeType,
                            answer: challengeAnswer
                        };
                    }
                    localStorage.setItem('MasterOfTheGrid', JSON.stringify(challenges));
                }
            });

            $(document).unbind('keypress');
        }
    }
});