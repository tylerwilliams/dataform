package protojson

import (
	"testing"

	"github.com/dataform-co/dataform/protos/dataform"
	"github.com/golang/protobuf/descriptor"
)

func TestMarshalToString(t *testing.T) {
	tests := []struct {
		name string
		pb   descriptor.Message
		want string
	}{
		{
			name: "simple message",
			pb: &dataform.ProjectConfig{
				Warehouse:               "foo",
				DefaultSchema:           "bar",
				IdempotentActionRetries: 32,
			},
			want: "{\"1\":\"foo\",\"2\":\"bar\",\"8\":32}",
		},
		{
			name: "message with repeated fields",
			pb: &dataform.RunConfig{
				Actions:     []string{"foo", "bar"},
				Tags:        []string{"baz", "qux"},
				FullRefresh: true,
			},
			want: "{\"1\":[\"foo\",\"bar\"],\"2\":true,\"5\":[\"baz\",\"qux\"]}",
		},
		{
			name: "message with submessage",
			pb: &dataform.CompileConfig{
				ProjectDir: "foo",
				ProjectConfigOverride: &dataform.ProjectConfig{
					Warehouse:               "bar",
					DefaultSchema:           "baz",
					IdempotentActionRetries: 16,
				},
			},
			want: "{\"1\":\"foo\",\"3\":{\"1\":\"bar\",\"2\":\"baz\",\"8\":16}}",
		},
		{
			name: "message with repeated submessage",
			pb: &dataform.ActionDescriptor{
				Description: "foo",
				Columns: []*dataform.ColumnDescriptor{
					&dataform.ColumnDescriptor{
						Description: "bar",
					},
					&dataform.ColumnDescriptor{
						Description: "baz",
					},
				},
			},
			want: "{\"1\":\"foo\",\"2\":[{\"1\":\"bar\"},{\"1\":\"baz\"}]}",
		},
		{
			name: "message with oneof",
			pb: &dataform.Field{
				Name: "foo",
				Type: &dataform.Field_Primitive{
					"bar",
				},
			},
			want: "{\"1\":\"foo\",\"2\":\"bar\"}",
		},
	}
	for _, testCase := range tests {
		m := &Marshaler{}
		got, err := m.MarshalToString(testCase.pb)
		if err != nil {
			t.Error(err)
		}
		if got != testCase.want {
			t.Errorf("called MarshalToString for %q, got %q, want %q", testCase.name, got, testCase.want)
		}
	}
}
