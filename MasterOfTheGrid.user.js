// ==UserScript==
// @name        MasterOfTheGrid
// @namespace   myerffoeg
// @version     1.0.9
// @author      Geoffrey Migliacci
// @description A MasterOfTheGrid simple cheat.
// @homepage    https://github.com/myerffoeg/masterofthegrid
// @icon        https://raw.githubusercontent.com/myerffoeg/masterofthegrid/master/MasterOfTheGrid.png
// @updateURL   https://github.com/myerffoeg/masterofthegrid/releases/latest/download/MasterOfTheGrid.user.js
// @downloadURL https://github.com/myerffoeg/masterofthegrid/releases/latest/download/MasterOfTheGrid.user.js
// @supportURL  https://github.com/myerffoeg/masterofthegrid/issues
// @match       http://masterofthegrid.sparklinlabs.com/play/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource    animate.css https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.0/animate.min.css
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @noframes
// @nocompat    Chrome
// ==/UserScript==

const challenges = localStorage.getItem('MasterOfTheGrid') === null ? {} : JSON.parse(localStorage.getItem('MasterOfTheGrid'));

$(document).ready(() => {
    $.ajax({
        method: 'GET',
        url: `https://raw.githubusercontent.com/myerffoeg/masterofthegrid/master/MasterOfTheGrid.user.json`,
        cache: true,
        dataType: 'json',
        success: (references) => {
            $.extend(true, challenges, references);
            localStorage.setItem('MasterOfTheGrid', JSON.stringify(challenges));

            GM_addStyle(GM_getResourceText('animate.css'));

            $(document).keydown((ev) => {
                if (!channel.data) {
                    return;
                }

                if (ev.code !== 'ShiftRight') {
                    return;
                }

                $(document).unbind('keydown');
                $(document).keydown((e) => {
                    if (e.code !== 'ShiftRight') {
                        return;
                    }

                    if (!channel.data.challenge) {
                        return;
                    }

                    if (!challenges[channel.data.challenge.category]) {
                        challenges[channel.data.challenge.category] = {};
                    }

                    if (challenges[channel.data.challenge.category][channel.data.challenge.id]) {
                        if (channel.data.challenge.challengeType === 'chooseMultiple') {
                            const answers = [];
                            challenges[channel.data.challenge.category][channel.data.challenge.id].answer.forEach((a) => {
                                const answer = channel.data.challenge.choices.indexOf(a);
                                $(`button[data-value='${answer}']:first`).parent().addClass('Selected').parent().addClass('Answered');
                                answers.push(answer);
                                channel.socket.emit('setAnswer', answers);
                            });
                        } else if (channel.data.challenge.challengeType === 'sort') {
                            channel.socket.emit('setAnswer', challenges[channel.data.challenge.category][channel.data.challenge.id].answer.reduce((a, c) => {
                                a.push(channel.data.challenge.choices.indexOf(c));
                                return a;
                            }, []));
                            // @todo answers sorted on ui
                        } else if (channel.data.challenge.challengeType === 'chooseOne') {
                            const answer = channel.data.challenge.choices.indexOf(challenges[channel.data.challenge.category][channel.data.challenge.id].answer);
                            $(`button[data-value='${answer}']:first`).parent().addClass('Selected').parent().addClass('Answered');
                            channel.socket.emit('setAnswer', answer);
                        } else if (channel.data.challenge.challengeType === 'trueOrFalse') {
                            const answer = challenges[channel.data.challenge.category][channel.data.challenge.id].answer;
                            $(`button[data-value='${answer}']:first`).parent().addClass('Selected').parent().addClass('Answered');
                            channel.socket.emit('setAnswer', answer);
                        } else if (channel.data.challenge.challengeType === 'estimate') {
                            const answer = challenges[channel.data.challenge.category][channel.data.challenge.id].answer;
                            $('.Estimate:first').val(answer);
                            channel.socket.emit('setAnswer', answer);
                        } else if (channel.data.challenge.challengeType === 'map') {
                            const answer = channel.data.challenge.choices.findIndex((a) => challenges[channel.data.challenge.category][channel.data.challenge.id].answer.x === a.x && challenges[channel.data.challenge.category][channel.data.challenge.id].answer.y === a.y);
                            $(`button[data-value='${answer}']:first`).addClass('Active');
                            channel.socket.emit('setAnswer', answer);
                        }
                    }
                });

                channel.socket.on('setState', (setState) => {
                    if (setState === 'challengeInProgress') {
                        if (challenges[channel.data.challenge.category][channel.data.challenge.id]) {
                            if (channel.data.challenge.challengeType === 'chooseMultiple') {
                                challenges[channel.data.challenge.category][channel.data.challenge.id].answer.forEach((a) => {
                                    const answer = channel.data.challenge.choices.indexOf(a);
                                    $(`button[data-value='${answer}']:first`).parent().addClass('animated infinite pulse');
                                });
                            } else if (channel.data.challenge.challengeType === 'sort') {
                                // @todo answers sorted on ui
                            } else if (channel.data.challenge.challengeType === 'chooseOne') {
                                const answer = channel.data.challenge.choices.indexOf(challenges[channel.data.challenge.category][channel.data.challenge.id].answer);
                                $(`button[data-value='${answer}']:first`).parent().addClass('animated infinite pulse');
                            } else if (channel.data.challenge.challengeType === 'trueOrFalse') {
                                const answer = challenges[channel.data.challenge.category][channel.data.challenge.id].answer;
                                $(`button[data-value='${answer}']:first`).parent().addClass('animated infinite pulse');
                            } else if (channel.data.challenge.challengeType === 'estimate') {
                                const answer = challenges[channel.data.challenge.category][channel.data.challenge.id].answer;
                                $('.Estimate:first').attr('placeholder', answer);
                            } else if (channel.data.challenge.challengeType === 'map') {
                                const answer = channel.data.challenge.choices.findIndex((a) => challenges[channel.data.challenge.category][channel.data.challenge.id].answer.x === a.x && challenges[channel.data.challenge.category][channel.data.challenge.id].answer.y === a.y);
                                $(`button[data-value='${answer}']:first`).addClass('animated infinite bounce');
                            }
                        }
                    }
                });

                channel.socket.on('challengeAnswer', (challengeAnswer) => {
                    if (!challenges[channel.data.challenge.category]) {
                        challenges[channel.data.challenge.category] = {};
                    }

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
                });
            });
        }
    });
});