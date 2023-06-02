I pretty quickly hit a wall with this program. I am able to generate all the info from the tracker, including a list of peers. I am able to sucessfully handshake with the peers. After the handshake, I should begin recieving info from the peers, especially what pieces of the file they have, but I recieve no info. I really am not sure what the bug is. If I had more time, I'm sure I could figure this out with some trial and error. I wrote the rest of the program, but since I am not getting responses from the peers I am not sure if it works.

The program can be run with

```
python3 main.py torrentfile
```

A class for a Tracker can be found in tracker.py. The purpose of this class is to generate a list of peers, and decode information from the torrent file, which is stored as class variables. First, in the Client class info is decoded using a bencode library. Then, information is extrapolated from this decoded information and stored in class variables. Some of this information is passed through a sha1 encoding. Request info, comprisoded of the url encoded info hash (hashed information about the torrent file) is sent as a get request, which returns a list of peers. The peers are decoded through the convert_byte_peers() file, and a list of Peer objects is stored in the tracker.

The Peer class holds information about each peer. The most important pieces of information are the ip and port of each peer, but it also holds information about if the peer is choked, or doesn't want to send pieces, and if we are interested in the peer. It also holds the bitfield of the peer, an array of boolean values describing which pieces of the file the peer holds. This class has a few methods. It can handle "have" messages, that state that the peer has a piece of the file, and update the bitfield. It can also handle recievcing the peer's bitfield, and strips any unuseful data from this bitfield. The main file recieves messages from the peer, but then calls the peer's recieve_message() function, which updates the variables of the class according to what message it has recieved.

The rest of the program is within the main.py file. I will examine every function in order.

The handshake function first builds the handshake. The first part of the handshake is the protol, "BitTorrent Protocol". This is followed by the length of the string. Next is the info hash, a hashed copy of the info of the torrent file. This if followed by the peer id, which lets the peer know the name the client is using. I used "pigeon". We then encode the handshake and send it on the socket associated with the peer. We then recieve 68 bits of a response from the peer. If the response is 68 bits then the handshake is a sucess, and we return True. Otherwise, we return False.

The req\_piece() function requests a piece from a peer. If the peer is choked, we send a message to the peer letting them know that we are interested and wait for the peer to unchoke. If we are requesting the last piece, we manually calculate the offset. Otherwise, we use the offset passed in. We construct a message, starting with the message type, which is always the same. We then add the index of the piece we want to recieve, then the offset of the piece, then the size of the piece (the piece size is universal). We add the length of the message to the begenning on the message. The entire thing has already been encoded. We then send the message to the socket associated with the peer. 

The recieve\_block() function recieves a block, a subpiece. We first recieve the id of the piece, which tells us where the piece goes. We then recieve the offset of the block, which tells us where the block goes in the piece. We then recieve an amount of bits equal to the block length, which is universal. We then return all this information.

validate\_piece() validates that the information of the piece is correct. We add all the blocks together, constructing the piece. We then make sure the hash of this information matches the hash we expect. The hashes of the pieces are found by the tracker. We then return a boolean value describing if the piece is valid, and if true, we return the piece.

recieve\_message() recieves a message from the peer. If we recieve zero, this is a stay alive signal. If we receive a 7, this is a signal that we are about to recieve a block, so we pass this to recieve\_block(). Otherwise we return the message.

peer\_download() is the function used to create a peer for each thread. We first try to connect to the peer through a soocket. We then try to handshake, and if it fails we close the socket and close the thread. We then create a bitfield for the peer, indicating at first that it has no pieces. We then enter an infinite loop. If we have all the pieces, and are still downloading,we exit the thread. We then recieve a message from the peer.

Then, we enter an if statement if we are working on the last piece, either by mathematically calculating if we are or by checking the last\_piece boolean. We first check if the piece we just downloaded is valid. If so, we update our progress. We then check if we're done downlaoding. If the piece is not valid, we discard it and try again.

If we arent on the last piece, we enter another if statement. We loop over every piece. If we have completed downloading this piece, we continue to the next iteration. We do the same if the piece has already been requested. If neither are true, we first update our list of requested pieces in both the main file and in our peer, to indicate that we are requesting this piece. We then request the piece, then break the loop.

write\_to\_disk() combines all the pieces and writes this data to the harddrive.


The purpose of the mainfile is to start all the peer threads and create a bunch of global variables. From the tracker we define the peer id, file length, info hash, amount of pieces, and piece length. We also create a list of piece hashes, and caclulate the size of the last piece. We then start the threads. When the file is done, we write it to the disk.
