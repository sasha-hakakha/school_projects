import sys
import threading
from client import Client
from tracker import Tracker
import time
BlOCK_SIZE = 16384

def handshake(s, self_name, peer_id, info_hash):
    self_name = self_name.encode('utf-8')
    self_name_length = bytes([len(self_name)])
    handshake = self_name_length + self_name + bytes(8) + info_hash + peer_id
    s.send(handshake)

    try:
        recieved = s.recv(68)
        while(len(recieved) < 68):
            recieved += s.recv(68-len(recieved))
    except Exception as e:
        print("handshake failed, could not recieve")
        print(e)
        return False
    
    #success if length of recieved handshake is correct
    if len(recieved) == 68:
        print("handshake suceeded")
        return True
    else:
        print("handshake failed")
        return False

def req_piece(peer, i, b_offset, last_piece):
    message_type = b'\x06'
    index = (i).to_bytes(4, "big")
    begin_offset = (b_offset).to_bytes(4, "big")
    p_length = (BLOCK_SIZE).to_bytes(4, "big")

    #if the peer is choked we just try to unchoke its
    if peer.choking:
        peer.s.send(b'\x00\x00\x00\x01\x02')
        peer.interested = True
        while peer.chocking:
            messege = recieve_message()
            peer.handle_message(message)

    recieved = 0
    if ((index + 1) < num_pieces):
        while((begin_offset + BLOCK_SIZE) < PIECE_LENGTH):
            if recieved % 5 == 0:
                time.sleep(0.05)
            if total == 0:
                b_offset  = 0
            else:
                b_offsett += BLOCK_SIZE
            begin_offset = (b_offset).to_bytes(4,"big")
            message = message_type + index + begin_offset_2 + piece_length
            message_length = len(message).to_bytes(4,"big")
            piece_request = message_length + message
            peer.s.send(piece_request)
            recieved += 1
    else: #last piece
        data = 0
        first_block = True
        while(data < LAST_PIECE_SIZE):
            if(data + BLOCK_SIZE > LAST_PIECE_SIZE):
                piece_size = (LAST_PIECE_SIZE - data).to_bytes(4, "big")
                data += LAST_PIECE_SIZE - data
                b_offset += BLOCK_SIZE
            else:
                first_block = False
                if recieved == 0:
                    b_offset = 0
                elif(total % 5 == 0):
                    time.sleep(0.05)
                else:
                    b_offset += BLOCK_SIZE
                #if last piece only has one block
                if(data + BLOCK_SIZE > LAST_PIECE_SIZE and first_block):
                    b_offset = 0
                begin_offset = (b_offset).to_bytes(4, "big")
                message = message_type + index + begin_offset + PIECE_SIZE
                message_length = len(message).to_bytes(4, "big")
                request = message_length + message
                peer.s.send(request)

def recieve_block(peer, block_len):
    print("recieving block")
    recieved = peer.s.recv(4)
    while(len(recieved) < 4):
        recieved += peer.s(4-len(recieved))
    piece_id = int.from_bytes(recieved,"big")
    recieved = 0
    recieved = peer.s.recv(4)
    while(len(recieved) < 4):
        recieved += peer.s.recv(4-len(recieved))
    block_offset = int.from_bytes(recieved,"big")
    recieved = 0
    recieved = peer.s.recv(block_len)
    while(len(recieved) < block_len):
        recieved += peer.s.recv(block_len - len(recieved))
    return recieved, block_offset, block_len, piece_id

def validate_piece(blocks, index):
    data = b''
    for block in blocks:
        data += block[0]
    m = hashlib.sha1()
    m.update(piece)
    piece_hash = m.digest()
    if piece_hash == hash_list[index]:
        return True, piece
    else:
        return False, None
def recieve_message(peer):
    try:
        recieved = peer.s.recv(4)
    except Exception as e:
        print('error, could not recieve message')
        print(e)
        exit()

    if not recieved:
        exit()

    while len(recieved) < 4:
        recieved +=  peer.s.recv(4-len(recieved))
    
    if int.from_bytes(recieved, "big") != 0:
        recieved = self.s.recv(1)
        if not recieved:
            return
        while(len(recieved) < 1):
            recieved += self.s.recv(1)
        return int.from_bytes(recieved, "big")
    return -1

def peer_download(peer):
    global completed
    blocks = []
    try:
        peer.s.connect((peer.ip, peer.port))
    except:
        print("could not connect to peer")
        return
    print("Connected with {}:{}".format(peer.ip,peer.port))

    handshake_success = handshake(peer.s, "BitTorrent protocol", peer_id, info_hash)
    if not handshake_success:
        peer.s.close()
        return

    index = 0
    downloading = True
    last_piece = 0

    for i in range(num_pieces):
        peer.bitfield.append(0)

    while True:
        lock.acquire()
        completed = all(p == 1 for p in pieces_requesting)
        lock.release()

        if completed and downloading:
            return
        message = recieve_message(peer)
        if message == 7:
            recieve_block(peer, BLOCK_SIZE)
        elif not message:
            pass
        else:
            peer.recieve_message(message)
            

        if((len(blocks) == piece_length/BLOCK_SIZE) or last_piece == -1):
            p_index = blocks[0][3]
            valid, piece = check_piece(subpieces,p_index)
            if(valid): #hash matches
                lock2.acquire()
                progress.append(1)
                sys.stdout.write("\r%d%% downloaded." % (float(len(progress))/num_pieces *100))
                if(len(progress)==num_pieces):
                    print("all pieces completed")
                lock2.release()
                sys.stdout.flush()

                lock.acquire()
                pieces_completed[p_index] = (piece,p_index)
                lock.release()
                blocks = [] #empties array
                downloading = True
                if(float(len(progress))/num_pieces *100 == 100):
                    completed = True
                    print("done")
                    return
            else: #hash didn't match so we download the piece again
                lock.acquire()
                pieces_requesting[p_index] = 0
                lock.release()
                subpieces = []
                downloading = True #to request it again

        if(downloading):
            for piece_index,piece in enumerate(peer.bitfield):
                lock.acquire() 
                if (pieces_completed[piece_index][0]==0):
                    if(pieces_requesting[piece_index] == 0):
                        pieces_requesting[piece_index] = 1
                        peer.piece_requested = piece_index
                        lock.release() 
                        request_piece(peer, p_index,0,handling_last)
                        print("requesting piece")
                        downloading = False
                        break
                    else:
                        lock.release()
                        continue
                else: 
                    lock.release()
                    continue 
        else: 
            continue

def write_to_disk(pieces):
    to_write = open(filename, 'wb+')
    data = b''
    for piece in pieces:
        data += piece
    to_wrirte.write(data)
    to_write.close()
    print('file written')

def main():
    global BLOCK_SIZE
    BLOCK_SIZE = 16354
    filename = sys.argv[1]

    client = Client(filename)
    global  peer_id
    peer_id = client.peer_id.encode('utf-8')
    tracker = Tracker(client)
    tracker.run()
    global num_pieces, piece_length, file_length, info_hash
    info_hash = tracker.info_hash
    file_length = tracker.file_length
    num_pieces = tracker.num_pieces
    piece_length = tracker.piece_length


    global lock, lock_two
    lock = threading.Lock()
    lock_two = threading.Lock()

    global pieces_requesting, pieces_completed
    pieces_requesting = []
    pieces_completed = []

    global hash_list
    pieces_hash = tracker.pieces
    hash_list = [pieces_hash[i:i+20] for i in range(0, len(pieces_hash), 20)]
    global last_piece_size
    last_piece_size = file_length - (piece_length * (num_pieces - 1))

    for i in range(num_pieces):
        pieces_completed.append((0,0))
        pieces_requesting.append(0)

    threads = []

    peers = tracker.peers
    for peer in peers:
        if len(threads) > 10:
            break
        p_thread = threading.Thread(target=peer_download, args=(peer,))
        threads.append(p_thread)
        p_thread.start()
    
    while not completed:
        time.sleep(1)
    print("download completed")

    write_to_disk(pieces_completed)

if __name__ == "__main__":
    main()

