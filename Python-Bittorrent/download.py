import client

class Download():
    def __init__(self, path):
        self.client = client.Client(path)
        self.piece_manager = piece.Piece_Manager(self.client)
        self.peer_manager = peer.Peer_Manager(self.client, self.piece_manager)
    def run(self):
        while not self.piece_manager.completed():
            if not self.peer_manager.has_unchoked():
                time.sleep(1)
                continue
        for piece
