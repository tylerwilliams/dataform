package protojson

import (
	"bytes"
	"encoding/json"
	"io"
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
	fieldDescriptors := fieldDescriptorsByName(msgDescriptor)
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

type Unmarshaler struct {
}

func (u *Unmarshaler) Unmarshal(r io.Reader, pb descriptor.Message) error {
	buf := new(bytes.Buffer)
	buf.ReadFrom(r)
	fieldNumberedJson, err := unmarshalJson(buf.String())
	if err != nil {
		return err
	}
	_, msgDescriptor := descriptor.ForMessage(pb)
	canonicalJson, err := toCanonicalJson(fieldNumberedJson, msgDescriptor)
	if err != nil {
		return err
	}
	jsonBytes, err := json.Marshal(canonicalJson)
	if err != nil {
		return err
	}
	jsonUnmarshaller := &jsonpb.Unmarshaler{}
	return jsonUnmarshaller.Unmarshal(bytes.NewReader(jsonBytes), pb)
}

func toCanonicalJson(protojsonMap map[string]interface{}, msgDescriptor *descriptorPb.DescriptorProto) (map[string]interface{}, error) {
	fieldDescriptors := fieldDescriptorsByNumber(msgDescriptor)
	jsonMap := make(map[string]interface{})
	for k, v := range protojsonMap {
		fieldNum, err := strconv.Atoi(k)
		if err != nil {
			return nil, err
		}
		field := fieldDescriptors[int32(fieldNum)]
		fieldName := field.GetName()
		if field.GetType() == descriptorPb.FieldDescriptorProto_TYPE_MESSAGE {
			fieldMsgDescriptor := descriptorForTypeName(field.GetTypeName()[1:])
			if field.GetLabel() == descriptorPb.FieldDescriptorProto_LABEL_REPEATED {
				origArr := v.([]interface{})
				newArr := make([]interface{}, len(origArr))
				for i, arrV := range origArr {
					canonicalJson, err := toCanonicalJson(arrV.(map[string]interface{}), fieldMsgDescriptor)
					if err != nil {
						return nil, err
					}
					newArr[i] = canonicalJson
				}
				jsonMap[fieldName] = newArr
			} else {
				canonicalJson, err := toCanonicalJson(v.(map[string]interface{}), fieldMsgDescriptor)
				if err != nil {
					return nil, err
				}
				jsonMap[fieldName] = canonicalJson
			}
		} else {
			jsonMap[fieldName] = v
		}
	}
	return jsonMap, nil
}

func unmarshalJson(val string) (map[string]interface{}, error) {
	bytes := []byte(val)
	var jsonMap interface{}
	if err := json.Unmarshal(bytes, &jsonMap); err != nil {
		return nil, err
	}
	return jsonMap.(map[string]interface{}), nil
}

func descriptorForTypeName(typeName string) *descriptorPb.DescriptorProto {
	msgGoType := proto.MessageType(typeName)
	zeroValPb := reflect.New(msgGoType).Elem().Interface()
	_, msgDescriptor := descriptor.ForMessage(zeroValPb.(descriptor.Message))
	return msgDescriptor
}

func fieldDescriptorsByName(descriptor *descriptorPb.DescriptorProto) map[string]*descriptorPb.FieldDescriptorProto {
	fieldDescriptors := make(map[string]*descriptorPb.FieldDescriptorProto)
	for _, fieldDescriptor := range descriptor.Field {
		fieldDescriptors[fieldDescriptor.GetName()] = fieldDescriptor
	}
	return fieldDescriptors
}

func fieldDescriptorsByNumber(descriptor *descriptorPb.DescriptorProto) map[int32]*descriptorPb.FieldDescriptorProto {
	fieldDescriptors := make(map[int32]*descriptorPb.FieldDescriptorProto)
	for _, fieldDescriptor := range descriptor.Field {
		fieldDescriptors[fieldDescriptor.GetNumber()] = fieldDescriptor
	}
	return fieldDescriptors
}
