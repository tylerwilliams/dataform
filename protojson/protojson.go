package protojson

import (
	"encoding/json"
	"reflect"
	"strconv"

	"github.com/golang/protobuf/descriptor"
	"github.com/golang/protobuf/jsonpb"
	"github.com/golang/protobuf/proto"
	descriptorPb "github.com/golang/protobuf/protoc-gen-go/descriptor"
)

type Marshaler struct {
}

func (m *Marshaler) MarshalToString(pb descriptor.Message) (string, error) {
	_, descriptor := descriptor.ForMessage(pb)
	canonicalJsonMap, err := marshalToCanonicalJson(pb)
	if err != nil {
		return "", err
	}
	jsonMap, err := toFieldNumberedJson(canonicalJsonMap, descriptor)
	if err != nil {
		return "", err
	}
	finalJsonStr, err := json.Marshal(jsonMap)
	if err != nil {
		return "", err
	}
	return string(finalJsonStr), nil
}

// Returns a (recursive) map representing a blob of JSON.
// Keys are protobuf field names; values are JSON-canonically-encoded values,
// except for enum values, which are their original int values (as declared in their .proto file).
func marshalToCanonicalJson(pb descriptor.Message) (map[string]interface{}, error) {
	jsonMarshaller := &jsonpb.Marshaler{
		EnumsAsInts: true,
		OrigName:    true,
	}
	pbJsonString, err := jsonMarshaller.MarshalToString(pb)
	if err != nil {
		return nil, err
	}
	return unmarshalJson(pbJsonString)
}

// Returns a (recursive) map representing a blob of JSON.
// Keys are protobuf field numbers; values are JSON-canonically-encoded values,
// except for enum values, which are their original int values (as declared in their .proto file).
func toFieldNumberedJson(jsonMap map[string]interface{}, msgDescriptor *descriptorPb.DescriptorProto) (map[string]interface{}, error) {
	fieldDescriptors := fieldDescriptors(msgDescriptor)
	protojsonMap := make(map[string]interface{})
	for k, v := range jsonMap {
		field := fieldDescriptors[k]
		fieldNumStr := strconv.Itoa(int(field.GetNumber()))
		if field.GetType() == descriptorPb.FieldDescriptorProto_TYPE_MESSAGE {
			fieldMsgDescriptor := descriptorForTypeName(field.GetTypeName()[1:])
			if field.GetLabel() == descriptorPb.FieldDescriptorProto_LABEL_REPEATED {
				origArr := v.([]interface{})
				newArr := make([]interface{}, len(origArr))
				for i, arrV := range origArr {
					fieldNumJson, err := toFieldNumberedJson(arrV.(map[string]interface{}), fieldMsgDescriptor)
					if err != nil {
						return nil, err
					}
					newArr[i] = fieldNumJson
				}
				protojsonMap[fieldNumStr] = newArr
			} else {
				fieldNumJson, err := toFieldNumberedJson(v.(map[string]interface{}), fieldMsgDescriptor)
				if err != nil {
					return nil, err
				}
				protojsonMap[fieldNumStr] = fieldNumJson
			}
		} else {
			protojsonMap[fieldNumStr] = v
		}
	}
	return protojsonMap, nil
}

func descriptorForTypeName(typeName string) *descriptorPb.DescriptorProto {
	msgGoType := proto.MessageType(typeName)
	zeroValPb := reflect.New(msgGoType).Elem().Interface()
	_, msgDescriptor := descriptor.ForMessage(zeroValPb.(descriptor.Message))
	return msgDescriptor
}

func unmarshalJson(val string) (map[string]interface{}, error) {
	bytes := []byte(val)
	var jsonMap interface{}
	if err := json.Unmarshal(bytes, &jsonMap); err != nil {
		return nil, err
	}
	return jsonMap.(map[string]interface{}), nil
}

func fieldDescriptors(descriptor *descriptorPb.DescriptorProto) map[string]*descriptorPb.FieldDescriptorProto {
	fieldDescriptors := make(map[string]*descriptorPb.FieldDescriptorProto)
	for _, fieldDescriptor := range descriptor.Field {
		fieldDescriptors[fieldDescriptor.GetName()] = fieldDescriptor
	}
	return fieldDescriptors
}
