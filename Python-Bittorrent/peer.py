from socket import *
class Peer:
    def __init__(self, ip, port, num_pieces):
        self.ip = ip
        self.port = port
        self.s = socket(AF_INET, SOCK_STREAM)
        self.s.settimeout(10)
        self.num_pieces = num_pieces
        self.choking = True
        self.interested = False
        self.bitfield = []
        self.piece_requested = None
    def recieve_message(self, message):
        if message == 0:
            self.choking = True
        elif message == 1:
            self.choking = False
        elif message == 2:
            self.interested = True
        elif message == 3:
            self.interested = False
        elif message == 4:
            print('have message')
            self.handle_have()
        elif message == 5:
            #bitfield recieved
            print('recieving bitfield')
            self.recieve_bitfield(message_length)
        elif message == 6:
            #request
            pass
        elif message == -1:
            #keep alive
            pass
        else:
            print("unknown message from peer")
    
    def recieve_bitfield(self,message_length):
        bitfield_len = messsage_length -1
        bitfield = peer.s.recv(bitfield_len)
        while(len(bitfield)<bitfield_len):
            bitfield += peer.s.recv(bitfield_len-len(bitfield))
        bit_array =[]
        for bit in bin(int.from_bytes(bitfield, byteorder="big")):
            bit_array.append(bit)
    #removing 0b part:
        try:
            bit_array.pop(0)
            bit_array.pop(0)
        except:#bitfield was empty ("dummy bitfield")
            self.bitarray = bit_array
            return
        for index, elements in enumerate(bit_array):
            bit_array[index]= int(bit_array[index])
        while(self.num_pieces - len(bit_array) != 0):
            try:
                bit_array.pop()
            except:
                self.bitarray = bit_array
                return
        self.bitfield = bit_array
    def handle_have(self):
        recieved = self.s.recv(4)
        while(len(recieved) < 4):
            recieved += self.s.recv(4-len(recieved))
        piece_id = int.from_bytes(recieved, "big")
        self.bitfield[piece_id] = 1

    def __str__(self):
        return "ip: " + str(self.ip) + " port: " + str(self.port)
