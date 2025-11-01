const addParticipantForm = document.getElementById('add-participant-form');
const participantNameInput = document.getElementById('participant-name');
const participantsList = document.getElementById('participants-list');
const generateBracketButton = document.getElementById('generate-bracket');
const bracketContainer = document.getElementById('bracket');

// Load participants and tournament data from local storage
let participants = JSON.parse(localStorage.getItem('participants')) || [];
let tournamentData = JSON.parse(localStorage.getItem('tournamentData')) || null;

addParticipantForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const participantName = participantNameInput.value.trim();
    if (participantName) {
        participants.push(participantName);
        saveParticipants();
        renderParticipants();
        participantNameInput.value = '';
    }
});

function renderParticipants() {
    participantsList.innerHTML = '';
    participants.forEach((participant) => {
        const li = document.createElement('li');
        li.textContent = participant;
        participantsList.appendChild(li);
    });
}

function saveParticipants() {
    localStorage.setItem('participants', JSON.stringify(participants));
}

generateBracketButton.addEventListener('click', () => {
    if (participants.length < 2) {
        alert("You need at least 2 participants to generate a bracket.");
        return;
    }
    generateBracket();
});

function generateBracket() {
    const numParticipants = participants.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
    const byes = nextPowerOfTwo - numParticipants;

    const initialParticipants = [...participants];
    for (let i = 0; i < byes; i++) {
        initialParticipants.push('BYE');
    }

    const shuffledParticipants = initialParticipants.sort(() => Math.random() - 0.5);

    tournamentData = { rounds: [] };
    const numRounds = Math.log2(nextPowerOfTwo);

    // Create Round 1
    const firstRound = { matches: [] };
    for (let i = 0; i < shuffledParticipants.length; i += 2) {
        firstRound.matches.push({
            participant1: shuffledParticipants[i],
            participant2: shuffledParticipants[i + 1],
            winner: null
        });
    }
    tournamentData.rounds.push(firstRound);

    // Create subsequent empty rounds
    let lastRoundMatches = firstRound.matches.length;
    for (let i = 1; i < numRounds; i++) {
        const numMatches = lastRoundMatches / 2;
        const round = { matches: [] };
        for (let j = 0; j < numMatches; j++) {
            round.matches.push({ participant1: null, participant2: null, winner: null });
        }
        tournamentData.rounds.push(round);
        lastRoundMatches = numMatches;
    }

    advanceByes(tournamentData);
    saveTournament();
    renderBracket();
}

function advanceByes(data) {
    let byesAdvanced;
    do {
        byesAdvanced = 0;
        data.rounds.forEach((round, roundIndex) => {
            round.matches.forEach((match, matchIndex) => {
                if(match.winner) return;

                let winner = null;
                if (match.participant1 === 'BYE' && match.participant2 !== 'BYE' && match.participant2 !== null) {
                    winner = match.participant2;
                } else if (match.participant2 === 'BYE' && match.participant1 !== 'BYE' && match.participant1 !== null) {
                    winner = match.participant1;
                } else if (match.participant1 !== null && match.participant2 === null) {
                    winner = match.participant1;
                } else if (match.participant1 === null && match.participant2 !== null) {
                    winner = match.participant2;
                }

                if(winner) {
                    match.winner = winner;
                    byesAdvanced++;
                    if (roundIndex + 1 < data.rounds.length) {
                        const nextRound = data.rounds[roundIndex + 1];
                        const nextMatchIndex = Math.floor(matchIndex / 2);
                        if (matchIndex % 2 === 0) {
                            nextRound.matches[nextMatchIndex].participant1 = winner;
                        } else {
                            nextRound.matches[nextMatchIndex].participant2 = winner;
                        }
                    }
                }
            });
        });
    } while (byesAdvanced > 0);
}


function renderBracket() {
    bracketContainer.innerHTML = '';
    if (!tournamentData) return;

    tournamentData.rounds.forEach((round, roundIndex) => {
        const roundDiv = document.createElement('div');
        roundDiv.classList.add('round');
        roundDiv.innerHTML = `<h3>Round ${roundIndex + 1}</h3>`;

        round.matches.forEach((match, matchIndex) => {
            const matchDiv = document.createElement('div');
            matchDiv.classList.add('match');

            const p1Div = createParticipantDiv(match.participant1, roundIndex, matchIndex, 1);
            const p2Div = createParticipantDiv(match.participant2, roundIndex, matchIndex, 2);

            if (match.winner) {
                if (match.winner === match.participant1) p1Div.classList.add('winner');
                else if (match.winner === match.participant2) p2Div.classList.add('winner');
            }

            matchDiv.appendChild(p1Div);
            matchDiv.appendChild(document.createTextNode(' vs '));
            matchDiv.appendChild(p2Div);
            roundDiv.appendChild(matchDiv);
        });
        bracketContainer.appendChild(roundDiv);
    });
}

function createParticipantDiv(name, roundIndex, matchIndex) {
    const div = document.createElement('div');
    div.classList.add('participant');
    div.textContent = name || 'TBD';
    // Add click handler if the participant can be declared a winner
    if (name && name !== 'BYE' && name !== 'TBD') {
        const match = tournamentData.rounds[roundIndex].matches[matchIndex];
        if (!match.winner && match.participant1 && match.participant2 && match.participant1 !== 'BYE' && match.participant2 !== 'BYE') {
             div.classList.add('clickable');
             div.dataset.roundIndex = roundIndex;
             div.dataset.matchIndex = matchIndex;
             div.dataset.participantName = name;
             div.addEventListener('click', handleWin);
        }
    }
    return div;
}

function handleWin(event) {
    const { roundIndex, matchIndex, participantName } = event.target.dataset;
    const rIndex = parseInt(roundIndex);
    const mIndex = parseInt(matchIndex);

    const match = tournamentData.rounds[rIndex].matches[mIndex];

    if (match.winner) return;

    match.winner = participantName;

    if (rIndex + 1 < tournamentData.rounds.length) {
        const nextRound = tournamentData.rounds[rIndex + 1];
        const nextMatchIndex = Math.floor(mIndex / 2);
        const nextMatch = nextRound.matches[nextMatchIndex];

        if (mIndex % 2 === 0) nextMatch.participant1 = participantName;
        else nextMatch.participant2 = participantName;

        advanceByes(tournamentData);
    }

    saveTournament();
    renderBracket();
}

function saveTournament() {
    localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
}

// Initial load
if (tournamentData) {
    renderBracket();
}
renderParticipants();
