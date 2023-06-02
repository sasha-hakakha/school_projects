import bencodepy
import hashlib
import btdht
import binascii
from time import sleep
from socket import *

def get_peers(torrent):
        f = open("debian.torrent","rb") 
        decoded = bencodepy.decode(f.read())

        info = bencodepy.encode(dict(decoded.get(b"info"))) 
        info_hash = hashlib.sha1(info).hexdigest() 
        print("info hash = " + info_hash)
        dht = btdht.DHT() 
        dht.start()
#        print("dht built")
        sleep(15) # wait for the DHT to build
        none = True
        while none: 
#                print("refreshing peers")
                peers = dht.get_peers(binascii.a2b_hex(info_hash))
                print(peers)
                sleep(1)
                if peers != None:
                    none = False
        return peers
#connecting to peers
def connect_to_peer(peers):
        s = socket(AF_INET, SOCK_STREAM)
        peer = peers[0][0]
        port = peers[0][1]
        s.connect((peer,port))
        print("connected to a peer")
        s.close()

peers = get_peers("debian.torrent")
print("at least one peer retrieved")
connect_to_peer(peers)
