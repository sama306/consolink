/// <reference types="astro/client" />

type User = import("./middleware").User;

declare namespace App {
  interface Locals {
    user: User | undefined;
  }
}
