#include<stdio.h>
int Add(int, int);

int main(void) {
    printf("hello world\n");

    printf("1 + 1 = %d\n", Add(1, 1));

    return 0;
}

int Add(int a, int b) {
    return a + b;
}