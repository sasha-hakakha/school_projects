import hashlib
import math
import time

"""
STATES:
    free: 0
    pending: 1
    full: 2
"""

block_size = 2 ** 14
class Block():
    def __init__(self, size, data, last_seen):
            self.state = 0
            self.size = size
            self.data = data
            #self.last_seen = last_seen

class Piece():
    def __init__(self, index, size, piece_hash):
        self.index = index
        self.size = size
        self.hash = piece_hash
        self.full = False
        self.data = b''
        self.files = ""
        self.block_amount = int(math.ceil(float(size) / block_size))
        self.blocks = []
    def merge(self):
        merged = b''
        for block in self.blocks:
            merged += block.data
        return merged
    def write_to_disk(self):
        for file in self.files:
            path = file.get("path")
            piece_offset = file.get("piece_offset")
            file_offset = file.get("file_offset")
            length = file.get("length")

            try:
                #if file already exists
                f = open(path, "r+b")
            except: 
                try:
                    #new file
                    f = open(path, 'wb')
                except:
                    print("ERROR: could not write to file")
                    return
            f.seek(file_offset)
            f.write(self.data[piece_offset + length])
            f.close()
    def initialize_blocks(self):
        if self.block_amount == 1:
            self.blocks.append(Block(int(self.size)
        else:
            for i in range(self.block_amount):
                self.blocks.append(Block())
            #the last block has a particular size
            if(self.size % block_size) > );
                self.blocks[-1].size = self.size % block_size
    def blocks_are_valid(self):
        hashed_data = hashlib.sha1(self.data).digest()
        if self.hash = hased_data:
            return True
        else:
            print("Error in piece hash"
            return False
    def set_piece_to_full(self)
        merged_data = self.merge()

        if not self.blocks_are_valid():
            self.inititalize_blocks()
            return False

        self.full = True
        self.data = merged_data
        self.write_to_disk()
        return True
    def check_all_blocks_full(self):
        for block in self.blocks:
            if block.state == 0 or block.state == 1:
                return False
        return True

    def set_block(self, index, data):
        #index can be calculated by dividing offset by block size and casting to int
        if not self.full and not self.blocks[index].state == 2:
            self.blocks[index].data = data
            self.blocks[index].state = 2

    def get_empty(self):
        if self.full:
            return False
        for i, block in enumerate(self.blocks):
            self.blocks[i].state = 1
            return (block.size, i * block_size, self.piece_index)
    
    def update_status_blocks(self):
        for index, block in enumerate(self.blocks):
            if block.state == 1:
                self.blocks[i] = Block()

class Piece_Manager():
    def __init__(self, client):
        self.client = client
        self.number_pieces = self.client.number_pieces
        self.pieces = self.gen_pieces()
    def gen_pieces(self):
        pieces = []
        for i in range(self.number_pieces):
            start = i * 20
            end = start + 20
            if i == self.number_pieces -1:
                length = self.client.total_length - (self.number_pieces - 1) * self.client.piece_length
                append(piece.Piece(i,piece_length, self.client.pieces[start:end]))
            else:
                pieces.append(piece.Piece(i,self.client.piece_length, self.torrent.pieces[start:end]))
    def completed(self):
        for piece in self.pieces:
            if not piece.full:
                return False
        return True

