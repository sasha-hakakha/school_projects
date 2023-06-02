import bencodepy
import hashlib
import btdht
import binascii
from time import sleep
from socket import *
from bcoding import bencode, bdecode
class Client:
        def __init__(self,filename):
                self.filename = filename
                self.protocol_id = "BitTorrent protocol"
                self.peer_id = "pigeon"
                self.reserved_area = "\x00"*8
                self.decoded_info = self.get_decoded_info()
        def get_decoded_info(self):
            with open(self.filename, "rb") as f:
                return bdecode(f)
"""
	def get_peers(self,torrent):

	#build dht
		dht = btdht.DHT() 
		dht.start() 
		sleep(15) # wait for the DHT to build
	
		none = True
		while none: 
			peers = dht.get_peers(binascii.a2b_hex(self.info_hash))
			print(peers)
			sleep(1)
			if peers != None:
				none = False
		return peers
	def get_handshake_message(self)
		return "".join([chr(len(self.protocol_id)), self.reserved_area,self.info_hash, self.peer_id])
#connecting to peers
def connect_to_peer(peers):
	s = socket(AF_INET, SO_REUSEADDR)
	peer = peers[0][0]
	port = peers[0][1]
	s.connect((peer,port))
	s.close()

peers = get_peers("debian.torrent")
connect_to_peer(peers)
"""
