function PeerState() {
    // an array of PeerState objects
    this.list = {};
}

PeerState.prototype.add = function(peerState){
    this.list[peerState.hostIp] = peerState;
}

PeerState.prototype.updateState = function(whichPeer, whoSentMessage, id){
    var newPeerState = this.list[whichPeer];

    if (whoSentMessage === 'peerSent'){
        if (id === 0){
            console.log('THEY choke');
            newPeerState.peer_choking = 1;
        } else if (id === 1){
            console.log('THEY unchoked');
            newPeerState.peer_choking = 0;
        } else if (id === 2){
            console.log('THEY are interested');
            newPeerState.peer_interested = 1;
        } else if (id === 3){
            console.log('THEY are uninterested');
            newPeerState.peer_interested = 0;
        }
    } else if (whoSentMessage === 'meSent'){
        if (whoSentMessage = 'meSent'){
            if (id === 0){
                console.log('I SENT choke');
                newPeerState.am_choking = 1;
            } else if (id === 1){
                console.log('I SENT unchoke');
                newPeerState.am_choking = 0;
            } else if (id === 2){
                console.log('I SENT interested');
                newPeerState.am_interested = 1;
            } else if (id === 3){
                console.log('I SENT uninterested');
                newPeerState.am_interested = 0;
            }
        }
    }
    console.log('updatedState',newPeerState);
    this.list[whichPeer] = newPeerState;
    return newPeerState;
}

PeerState.prototype.getState = function(whichPeer){
    return this.list[whichPeer];
}

module.exports = {
    PeerState
}
