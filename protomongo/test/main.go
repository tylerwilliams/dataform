package main

import (
	"context"
	"fmt"
	"log"
	"reflect"

	"github.com/dataform-co/dataform/protomongo"
	"github.com/dataform-co/dataform/protos/dataform"
	"github.com/golang/protobuf/proto"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {

	rb := bson.NewRegistryBuilder()
	rb.RegisterCodec(reflect.TypeOf((*proto.Message)(nil)).Elem(), &protomongo.ProtobufCodec{})

	// Set client options
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017").SetRegistry(rb.Build())

	// Connect to MongoDB
	client, err := mongo.Connect(context.TODO(), clientOptions)

	if err != nil {
		log.Fatal(err)
	}

	// Check the connection
	err = client.Ping(context.TODO(), nil)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connected to MongoDB!")

	collection := client.Database("test").Collection("protobufs")

	pc := &dataform.Field{
		Name: "foo",
		Type: &dataform.Field_Primitive{
			"baz",
		},
	}

	insertResult, err := collection.InsertOne(context.TODO(), pc)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Inserted a single document: ", insertResult.InsertedID)

	result := new(dataform.Field)

	err = collection.FindOne(context.TODO(), bson.D{{"1", "foo"}}).Decode(&result)
	if err != nil {
		log.Fatal(err)
	}

	tm := &proto.TextMarshaler{}
	fmt.Printf("Found a single document: %+v\n", tm.Text(result))
}
