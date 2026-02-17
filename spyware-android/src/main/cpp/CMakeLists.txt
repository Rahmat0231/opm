cmake_minimum_required(VERSION 3.22.1)
project("kalkulator")

add_library(
    native-security
    SHARED
    native-lib.cpp
)

find_library(
    log-lib
    log
)

target_link_libraries(
    native-security
    ${log-lib}
)
