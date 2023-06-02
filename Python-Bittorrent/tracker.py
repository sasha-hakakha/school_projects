import math
import socket
import requests
import urllib
import hashlib
from bcoding import bencode, bdecode
from peer import Peer

class Tracker():
    def __init__(self, client):
        self.client = client
        self.request_info = None
        self.filename = client.filename
        self.file_length = None
        self.piece_length = None
        self.num_pieces = None
        self.peers = []
        self.pieces = None
        self.host_name = None
        self.peer_id = client.peer_id
        self.info_hash = None
    
    def convert_byte_peers(self, peers):
        byte_list= [peers[i:i+6] for i in range(0, len(peers), 6)]
        peers = []
        for byt in byte_list:
            peers.append((socket.inet_ntoa(byt[:4]),int.from_bytes(byt[4:6],"big")))
        return peers 
    def run(self):
        torrent_info = self.client.decoded_info
        self.request_info = torrent_info['announce']
        print('request string: ' + self.request_info)
        if ("files" in list(torrent_info['info'].keys())):
            self.filename = torrent_info['info']['files'][0]['path'][0]
            self.file_length = torrent_info['info']['files'][0]['length']
        elif('name' in list(torrent_info['info'].keys())):
            self.filename = torrent_info['info']['name']
            self.file_length = torrent_info['info']['length']
        else:
            print("error: could not generate tracker filename and length")
        
        self.pieces = torrent_info["info"]["pieces"]
        self.piece_length = torrent_info["info"]["piece length"]
        self.num_pieces = math.ceil(self.file_length / self.piece_length)

        print("File length:{} Mb, Piece length: {} bytes, Number of pieces:{}.".format(self.file_length/1000000,self.piece_length,self.num_pieces))


        if ('https' in torrent_info):
            self.host_name = self.request_info[8:].split('/')
        else:
            self.host_name = self.request_info[7:].split('/')
        
        #we cant use the info hash from the client because its encoded in the wrong way

        info = bencode(torrent_info['info'])
        m = hashlib.sha1()
        m.update(info)
        self.info_hash = m.digest()
        url_encoded_info_hash= urllib.parse.quote_plus(self.info_hash) #url encoding of request

        m = hashlib.sha1()
        m.update(self.client.peer_id.encode('utf-8'))
        peer_id = m.digest()
        url_encoded_peer_id = urllib.parse.quote_plus(peer_id)



        self.request_info += "?info_hash="+url_encoded_info_hash +"&peer_id="+url_encoded_peer_id+"&port=6881"+"&compact=1"

        GET_request = urllib.request.Request(self.request_info)
        f = urllib.request.urlopen(GET_request)
        data = f.read()
        f.close()

        decoded_request_data = bdecode(data)
        compact_peers = decoded_request_data['peers']
        raw_peers = self.convert_byte_peers(compact_peers)
        for p in raw_peers:
            self.peers.append(Peer(p[0],p[1], self.num_pieces))

