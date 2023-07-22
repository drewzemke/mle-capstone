class User {
  name: string;
  age: number;

  constructor(name = "Bob", age = 24) {
    this.name = name;
    this.age = age;
  }

  withName(name: string) {
    this.name = name;
    return this;
  }
}

class UserBuilder {
  name: string | undefined;
  age: number | undefined;

  constructor() {}
}

const user = new UserBuilder().withName("Bob").withAge(24).build();
