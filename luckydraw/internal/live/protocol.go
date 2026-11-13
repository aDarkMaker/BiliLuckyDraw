package live

import (
	"bytes"
	"compress/zlib"
	"encoding/binary"
	"encoding/json"
	"io"

	"github.com/gorilla/websocket"
)

func (c *DanmakuClient) makePacket(data []byte, operation int32) []byte {
	packetLen := int32(len(data) + PacketHeaderLength)
	buf := new(bytes.Buffer)

	binary.Write(buf, binary.BigEndian, packetLen)
	binary.Write(buf, binary.BigEndian, int16(PacketHeaderLength))
	binary.Write(buf, binary.BigEndian, int16(ProtocolVersion))
	binary.Write(buf, binary.BigEndian, operation)
	binary.Write(buf, binary.BigEndian, int32(2))
	buf.Write(data)

	return buf.Bytes()
}

func (c *DanmakuClient) parsePacket(data []byte, authChan chan<- bool, authSent *bool) {
	if len(data) == 0 {
		return
	}
	buf := bytes.NewReader(data)

	for buf.Len() > 0 {
		if buf.Len() < 16 {
			break
		}
		var header struct {
			PacketLen   int32
			HeaderLen   int16
			ProtocolVer int16
			Operation   int32
			SequenceID  int32
		}

		if err := binary.Read(buf, binary.BigEndian, &header); err != nil {
			break
		}

		if header.PacketLen < int32(header.HeaderLen) {
			break
		}

		bodyLen := header.PacketLen - int32(header.HeaderLen)
		if bodyLen < 0 || bodyLen > 1024*1024 {
			break
		}
		bodyData := make([]byte, bodyLen)
		if n, err := buf.Read(bodyData); err != nil || n != int(bodyLen) {
			break
		}

		switch header.Operation {
		case OperationMessage:
			switch header.ProtocolVer {
			case 2:
				reader, err := zlib.NewReader(bytes.NewReader(bodyData))
				if err == nil {
					decompressed, _ := io.ReadAll(reader)
					reader.Close()
					c.parsePacket(decompressed, authChan, authSent)
				}
			case 0:
				var msg DanmakuMessage
				if err := json.Unmarshal(bodyData, &msg); err == nil {
					c.handleMessage(&msg)
				}
			}
		case OperationWelcome:
			c.mu.Lock()
			c.authSuccess = true
			conn := c.conn
			c.mu.Unlock()
			if !*authSent {
				select {
				case authChan <- true:
				default:
				}
				*authSent = true
			}
			if conn != nil {
				packet := c.makePacket([]byte{}, OperationHeartbeat)
				conn.WriteMessage(websocket.BinaryMessage, packet)
			}
		case OperationHeartbeatAck:
			if len(bodyData) == 4 {
				online := binary.BigEndian.Uint32(bodyData)
				c.mu.Lock()
				c.online = int64(online)
				c.mu.Unlock()
			}
		}
	}
}
