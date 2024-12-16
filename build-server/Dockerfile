FROM ubuntu:focal

RUN apt-get update

RUN apt install -y nodejs npm

RUN apt-get install git -y

WORKDIR /home/app

COPY main.sh main.sh

ENTRYPOINT [ "/home/app/main.sh" ]