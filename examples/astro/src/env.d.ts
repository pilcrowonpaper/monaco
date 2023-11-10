/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		user: import("@monaco-auth/core").User | null;
	}
}