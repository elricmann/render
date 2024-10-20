// MIT License
//
// Copyright (c) 2024 Elric Neumann (elricmann)
//
// This module requires linking with a custom libc and then building with
// wasm32-unknown-unknown ABI unless _IO_FILE is not required, in which case
// you may remove the related function(s) for writing librender's bytecode.
// This source is generated from target.h so edit at your own discretion.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

#![allow(
    dead_code,
    mutable_transmutes,
    non_camel_case_types,
    non_snake_case,
    non_upper_case_globals,
    unused_assignments,
    unused_mut
)]
#![feature(extern_types)]

extern "C" {
    pub type _IO_wide_data;
    pub type _IO_codecvt;
    pub type _IO_marker;

    static mut stderr: *mut FILE;

    fn fclose(__stream: *mut FILE) -> libc::c_int;
    fn fopen(_: *const libc::c_char, _: *const libc::c_char) -> *mut FILE;
    fn fprintf(_: *mut FILE, _: *const libc::c_char, _: ...) -> libc::c_int;
    fn fwrite(
        _: *const libc::c_void,
        _: libc::c_ulong,
        _: libc::c_ulong,
        _: *mut FILE,
    ) -> libc::c_ulong;
    fn malloc(_: libc::c_ulong) -> *mut libc::c_void;
    fn realloc(_: *mut libc::c_void, _: libc::c_ulong) -> *mut libc::c_void;
    fn free(_: *mut libc::c_void);
    fn exit(_: libc::c_int) -> !;
}

pub type size_t = libc::c_ulong;
pub type __uint8_t = libc::c_uchar;
pub type __off_t = libc::c_long;
pub type __off64_t = libc::c_long;
pub type uint8_t = __uint8_t;

#[repr(C)]
#[derive(Copy, Clone)]
pub struct _IO_FILE {
    pub _flags: libc::c_int,
    pub _IO_read_ptr: *mut libc::c_char,
    pub _IO_read_end: *mut libc::c_char,
    pub _IO_read_base: *mut libc::c_char,
    pub _IO_write_base: *mut libc::c_char,
    pub _IO_write_ptr: *mut libc::c_char,
    pub _IO_write_end: *mut libc::c_char,
    pub _IO_buf_base: *mut libc::c_char,
    pub _IO_buf_end: *mut libc::c_char,
    pub _IO_save_base: *mut libc::c_char,
    pub _IO_backup_base: *mut libc::c_char,
    pub _IO_save_end: *mut libc::c_char,
    pub _markers: *mut _IO_marker,
    pub _chain: *mut _IO_FILE,
    pub _fileno: libc::c_int,
    pub _flags2: libc::c_int,
    pub _old_offset: __off_t,
    pub _cur_column: libc::c_ushort,
    pub _vtable_offset: libc::c_schar,
    pub _shortbuf: [libc::c_char; 1],
    pub _lock: *mut libc::c_void,
    pub _offset: __off64_t,
    pub _codecvt: *mut _IO_codecvt,
    pub _wide_data: *mut _IO_wide_data,
    pub _freeres_list: *mut _IO_FILE,
    pub _freeres_buf: *mut libc::c_void,
    pub __pad5: size_t,
    pub _mode: libc::c_int,
    pub _unused2: [libc::c_char; 20],
}

pub type _IO_lock_t = ();
pub type FILE = _IO_FILE;

pub const OPCODE_APPEND_SIBLING: libc::c_uint = 11;
pub const OPCODE_EVENT_LISTENER: libc::c_uint = 10;
pub const OPCODE_STYLE: libc::c_uint = 9;
pub const OPCODE_REMOVE_ATTRIBUTE: libc::c_uint = 8;
pub const OPCODE_SET_TEXT: libc::c_uint = 7;
pub const OPCODE_TEXT_NODE: libc::c_uint = 6;
pub const OPCODE_REPLACE_CHILD: libc::c_uint = 5;
pub const OPCODE_REMOVE_CHILD: libc::c_uint = 4;
pub const OPCODE_APPEND_CHILD: libc::c_uint = 3;
pub const OPCODE_SET_ATTRIBUTE: libc::c_uint = 2;
pub const OPCODE_CREATE_ELEMENT: libc::c_uint = 1;
pub const OPCODE_NOP: libc::c_uint = 0;

#[derive(Copy, Clone)]
#[repr(C)]
pub struct librender_bytecode_buffer {
    pub buffer: *mut uint8_t,
    pub size: size_t,
    pub capacity: size_t,
    pub is_locked: libc::c_int,
}

#[no_mangle]
pub unsafe extern "C" fn librender_create_buffer(
    mut initial_capacity: size_t,
) -> *mut librender_bytecode_buffer {
    if initial_capacity == 0 as libc::c_int as libc::c_ulong {
        initial_capacity = 1024 as libc::c_int as size_t;
    }

    let mut buf: *mut librender_bytecode_buffer =
        malloc(::core::mem::size_of::<librender_bytecode_buffer>() as libc::c_ulong)
            as *mut librender_bytecode_buffer;

    if buf.is_null() {
        fprintf(
            stderr,
            b"Failed to allocate memory for buffer structure\n\0" as *const u8
                as *const libc::c_char,
        );
        exit(1 as libc::c_int);
    }

    (*buf).buffer =
        malloc(initial_capacity.wrapping_mul(::core::mem::size_of::<uint8_t>() as libc::c_ulong))
            as *mut uint8_t;

    if ((*buf).buffer).is_null() {
        fprintf(
            stderr,
            b"Failed to allocate memory for buffer data\n\0" as *const u8 as *const libc::c_char,
        );
        free(buf as *mut libc::c_void);
        exit(1 as libc::c_int);
    }

    (*buf).size = 0 as libc::c_int as size_t;
    (*buf).capacity = initial_capacity;
    (*buf).is_locked = 0 as libc::c_int;

    return buf;
}

#[no_mangle]
pub unsafe extern "C" fn librender_free_buffer(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() {
        return;
    }

    if !((*buf).buffer).is_null() {
        free((*buf).buffer as *mut libc::c_void);
    }

    free(buf as *mut libc::c_void);
}

#[no_mangle]
pub unsafe extern "C" fn librender_lock_buffer(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() {
        return;
    }

    (*buf).is_locked = 1 as libc::c_int;
}

#[no_mangle]
pub unsafe extern "C" fn librender_unlock_buffer(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() {
        return;
    }

    (*buf).is_locked = 0 as libc::c_int;
}

#[no_mangle]
pub unsafe extern "C" fn librender_is_buffer_locked(
    mut buf: *const librender_bytecode_buffer,
) -> libc::c_int {
    if buf.is_null() {
        return 0 as libc::c_int;
    }

    return (*buf).is_locked;
}

#[no_mangle]
pub unsafe extern "C" fn librender_append_byte(
    mut buf: *mut librender_bytecode_buffer,
    mut byte: uint8_t,
) {
    if buf.is_null() || (*buf).is_locked != 0 {
        return;
    }

    if (*buf).size >= (*buf).capacity {
        (*buf).capacity = ((*buf).capacity as libc::c_ulong)
            .wrapping_mul(2 as libc::c_int as libc::c_ulong) as size_t
            as size_t;

        (*buf).buffer = realloc(
            (*buf).buffer as *mut libc::c_void,
            ((*buf).capacity).wrapping_mul(::core::mem::size_of::<uint8_t>() as libc::c_ulong),
        ) as *mut uint8_t;

        if ((*buf).buffer).is_null() {
            fprintf(
                stderr,
                b"Failed to reallocate memory for buffer\n\0" as *const u8 as *const libc::c_char,
            );
            exit(1 as libc::c_int);
        }
    }

    let fresh0 = (*buf).size;
    (*buf).size = ((*buf).size).wrapping_add(1);
    *((*buf).buffer).offset(fresh0 as isize) = byte;
}

#[no_mangle]
pub unsafe extern "C" fn librender_append_bytes(
    mut buf: *mut librender_bytecode_buffer,
    mut bytes: *const uint8_t,
    mut count: size_t,
) {
    if buf.is_null() || (*buf).is_locked != 0 || bytes.is_null() {
        return;
    }

    let mut i: size_t = 0 as libc::c_int as size_t;

    while i < count {
        librender_append_byte(buf, *bytes.offset(i as isize));
        i = i.wrapping_add(1);
        i;
    }
}

#[no_mangle]
pub unsafe extern "C" fn librender_create_element(
    mut buf: *mut librender_bytecode_buffer,
    mut tag_name: *const libc::c_char,
    mut tag_length: uint8_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || tag_name.is_null()
        || tag_length as libc::c_int == 0 as libc::c_int
    {
        return;
    }

    librender_append_byte(buf, OPCODE_CREATE_ELEMENT as libc::c_int as uint8_t);
    librender_append_byte(buf, tag_length);
    librender_append_bytes(buf, tag_name as *const uint8_t, tag_length as size_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_set_attribute(
    mut buf: *mut librender_bytecode_buffer,
    mut attr_name: *const libc::c_char,
    mut attr_name_length: uint8_t,
    mut attr_value: *const libc::c_char,
    mut attr_value_length: uint8_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || attr_name.is_null()
        || attr_value.is_null()
        || attr_name_length as libc::c_int == 0 as libc::c_int
        || attr_value_length as libc::c_int == 0 as libc::c_int
    {
        return;
    }

    librender_append_byte(buf, OPCODE_SET_ATTRIBUTE as libc::c_int as uint8_t);
    librender_append_byte(buf, attr_name_length);
    librender_append_bytes(buf, attr_name as *const uint8_t, attr_name_length as size_t);
    librender_append_byte(buf, attr_value_length);
    librender_append_bytes(
        buf,
        attr_value as *const uint8_t,
        attr_value_length as size_t,
    );
}

#[no_mangle]
pub unsafe extern "C" fn librender_append_child(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() || (*buf).is_locked != 0 {
        return;
    }

    librender_append_byte(buf, OPCODE_APPEND_CHILD as libc::c_int as uint8_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_append_sibling(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() || (*buf).is_locked != 0 {
        return;
    }

    librender_append_byte(buf, OPCODE_APPEND_SIBLING as libc::c_int as uint8_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_remove_child(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() || (*buf).is_locked != 0 {
        return;
    }

    librender_append_byte(buf, OPCODE_REMOVE_CHILD as libc::c_int as uint8_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_replace_child(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() || (*buf).is_locked != 0 {
        return;
    }

    librender_append_byte(buf, OPCODE_REPLACE_CHILD as libc::c_int as uint8_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_text_node(
    mut buf: *mut librender_bytecode_buffer,
    mut text: *const libc::c_char,
    mut text_length: uint8_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || text.is_null()
        || text_length as libc::c_int == 0 as libc::c_int
    {
        return;
    }

    librender_append_byte(buf, OPCODE_TEXT_NODE as libc::c_int as uint8_t);
    librender_append_byte(buf, text_length);
    librender_append_bytes(buf, text as *const uint8_t, text_length as size_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_set_text(
    mut buf: *mut librender_bytecode_buffer,
    mut text: *const libc::c_char,
    mut text_length: uint8_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || text.is_null()
        || text_length as libc::c_int == 0 as libc::c_int
    {
        return;
    }

    librender_append_byte(buf, OPCODE_SET_TEXT as libc::c_int as uint8_t);
    librender_append_byte(buf, text_length);
    librender_append_bytes(buf, text as *const uint8_t, text_length as size_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_remove_attribute(
    mut buf: *mut librender_bytecode_buffer,
    mut attr_name: *const libc::c_char,
    mut attr_name_length: uint8_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || attr_name.is_null()
        || attr_name_length as libc::c_int == 0 as libc::c_int
    {
        return;
    }

    librender_append_byte(buf, OPCODE_REMOVE_ATTRIBUTE as libc::c_int as uint8_t);
    librender_append_byte(buf, attr_name_length);
    librender_append_bytes(buf, attr_name as *const uint8_t, attr_name_length as size_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_set_style(
    mut buf: *mut librender_bytecode_buffer,
    mut style_name: *const libc::c_char,
    mut style_name_length: uint8_t,
    mut style_value: *const libc::c_char,
    mut style_value_length: uint8_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || style_name.is_null()
        || style_value.is_null()
        || style_name_length as libc::c_int == 0 as libc::c_int
        || style_value_length as libc::c_int == 0 as libc::c_int
    {
        return;
    }

    librender_append_byte(buf, OPCODE_STYLE as libc::c_int as uint8_t);
    librender_append_byte(buf, style_name_length);
    librender_append_bytes(
        buf,
        style_name as *const uint8_t,
        style_name_length as size_t,
    );
    librender_append_byte(buf, style_value_length);
    librender_append_bytes(
        buf,
        style_value as *const uint8_t,
        style_value_length as size_t,
    );
}

#[no_mangle]
pub unsafe extern "C" fn librender_add_event_listener(
    mut buf: *mut librender_bytecode_buffer,
    mut event_type: *const libc::c_char,
    mut event_type_length: uint8_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || event_type.is_null()
        || event_type_length as libc::c_int == 0 as libc::c_int
    {
        return;
    }

    librender_append_byte(buf, OPCODE_EVENT_LISTENER as libc::c_int as uint8_t);
    librender_append_byte(buf, event_type_length);
    librender_append_bytes(
        buf,
        event_type as *const uint8_t,
        event_type_length as size_t,
    );
}

#[no_mangle]
pub unsafe extern "C" fn librender_nop(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() || (*buf).is_locked != 0 {
        return;
    }

    librender_append_byte(buf, OPCODE_NOP as libc::c_int as uint8_t);
}

#[no_mangle]
pub unsafe extern "C" fn librender_output_bytecode(
    mut buf: *const librender_bytecode_buffer,
    mut filename: *const libc::c_char,
) {
    if buf.is_null() || filename.is_null() {
        return;
    }

    let mut file: *mut FILE = fopen(filename, b"wb\0" as *const u8 as *const libc::c_char);

    if file.is_null() {
        fprintf(
            stderr,
            b"Failed to open file %s for writing\n\0" as *const u8 as *const libc::c_char,
            filename,
        );
        return;
    }

    fwrite(
        (*buf).buffer as *const libc::c_void,
        1 as libc::c_int as libc::c_ulong,
        (*buf).size,
        file,
    );

    fclose(file);
}

#[no_mangle]
pub unsafe extern "C" fn librender_clear_buffer(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() || (*buf).is_locked != 0 {
        return;
    }

    (*buf).size = 0 as libc::c_int as size_t;
}

#[no_mangle]
pub unsafe extern "C" fn librender_merge_bytecode(
    mut buffers: *mut *mut librender_bytecode_buffer,
    mut num_buffers: size_t,
) -> *mut librender_bytecode_buffer {
    if buffers.is_null() || num_buffers == 0 as libc::c_int as libc::c_ulong {
        return 0 as *mut librender_bytecode_buffer;
    }

    let mut total_size: size_t = 0 as libc::c_int as size_t;
    let mut i: size_t = 0 as libc::c_int as size_t;

    while i < num_buffers {
        if !(*buffers.offset(i as isize)).is_null() {
            total_size = (total_size as libc::c_ulong)
                .wrapping_add((**buffers.offset(i as isize)).size)
                as size_t as size_t;
        }
        i = i.wrapping_add(1);
        i;
    }

    let mut merged_buffer: *mut librender_bytecode_buffer = librender_create_buffer(total_size);

    if merged_buffer.is_null() {
        return 0 as *mut librender_bytecode_buffer;
    }

    let mut i_0: size_t = 0 as libc::c_int as size_t;

    while i_0 < num_buffers {
        if !(*buffers.offset(i_0 as isize)).is_null() {
            librender_append_bytes(
                merged_buffer,
                (**buffers.offset(i_0 as isize)).buffer,
                (**buffers.offset(i_0 as isize)).size,
            );
        }
        i_0 = i_0.wrapping_add(1);
        i_0;
    }

    return merged_buffer;
}

#[no_mangle]
pub unsafe extern "C" fn librender_copy_buffer(
    mut dst: *mut librender_bytecode_buffer,
    mut src: *const librender_bytecode_buffer,
) {
    if dst.is_null()
        || src.is_null()
        || (*dst).is_locked != 0
        || (*src).size == 0 as libc::c_int as libc::c_ulong
    {
        return;
    }

    librender_append_bytes(dst, (*src).buffer, (*src).size);
}

#[no_mangle]
pub unsafe extern "C" fn librender_resize_buffer(
    mut buf: *mut librender_bytecode_buffer,
    mut new_capacity: size_t,
) {
    if buf.is_null() || (*buf).is_locked != 0 || new_capacity <= (*buf).capacity {
        return;
    }

    (*buf).buffer = realloc(
        (*buf).buffer as *mut libc::c_void,
        new_capacity.wrapping_mul(::core::mem::size_of::<uint8_t>() as libc::c_ulong),
    ) as *mut uint8_t;

    if ((*buf).buffer).is_null() {
        fprintf(
            stderr,
            b"Failed to reallocate buffer\n\0" as *const u8 as *const libc::c_char,
        );
        exit(1 as libc::c_int);
    }

    (*buf).capacity = new_capacity;
}

#[no_mangle]
pub unsafe extern "C" fn librender_append_bytecode(
    mut buf: *mut librender_bytecode_buffer,
    mut bytecode: *const uint8_t,
    mut bytecode_size: size_t,
) {
    if buf.is_null()
        || (*buf).is_locked != 0
        || bytecode.is_null()
        || bytecode_size == 0 as libc::c_int as libc::c_ulong
    {
        return;
    }

    librender_append_bytes(buf, bytecode, bytecode_size);
}

#[no_mangle]
pub unsafe extern "C" fn librender_insert_byte(
    mut buf: *mut librender_bytecode_buffer,
    mut index: size_t,
    mut byte: uint8_t,
) {
    if buf.is_null() || (*buf).is_locked != 0 || index > (*buf).size {
        return;
    }

    if (*buf).size >= (*buf).capacity {
        (*buf).capacity = ((*buf).capacity as libc::c_ulong)
            .wrapping_mul(2 as libc::c_int as libc::c_ulong) as size_t
            as size_t;

        (*buf).buffer = realloc(
            (*buf).buffer as *mut libc::c_void,
            ((*buf).capacity).wrapping_mul(::core::mem::size_of::<uint8_t>() as libc::c_ulong),
        ) as *mut uint8_t;

        if ((*buf).buffer).is_null() {
            fprintf(
                stderr,
                b"Failed to reallocate buffer during insertion\n\0" as *const u8
                    as *const libc::c_char,
            );
            exit(1 as libc::c_int);
        }
    }

    let mut i: size_t = (*buf).size;

    while i > index {
        *((*buf).buffer).offset(i as isize) =
            *((*buf).buffer).offset(i.wrapping_sub(1 as libc::c_int as libc::c_ulong) as isize);
        i = i.wrapping_sub(1);
        i;
    }

    *((*buf).buffer).offset(index as isize) = byte;
    (*buf).size = ((*buf).size).wrapping_add(1);
    (*buf).size;
}

#[no_mangle]
pub unsafe extern "C" fn librender_remove_byte(
    mut buf: *mut librender_bytecode_buffer,
    mut index: size_t,
) {
    if buf.is_null() || (*buf).is_locked != 0 || index >= (*buf).size {
        return;
    }

    let mut i: size_t = index;

    while i < ((*buf).size).wrapping_sub(1 as libc::c_int as libc::c_ulong) {
        *((*buf).buffer).offset(i as isize) =
            *((*buf).buffer).offset(i.wrapping_add(1 as libc::c_int as libc::c_ulong) as isize);
        i = i.wrapping_add(1);
        i;
    }

    (*buf).size = ((*buf).size).wrapping_sub(1);
    (*buf).size;
}

#[no_mangle]
pub unsafe extern "C" fn librender_get_byte(
    mut buf: *const librender_bytecode_buffer,
    mut index: size_t,
    mut out_byte: *mut uint8_t,
) {
    if buf.is_null() || out_byte.is_null() || index >= (*buf).size {
        return;
    }

    *out_byte = *((*buf).buffer).offset(index as isize);
}

#[no_mangle]
pub unsafe extern "C" fn librender_clone_buffer(
    mut src: *const librender_bytecode_buffer,
) -> *mut librender_bytecode_buffer {
    if src.is_null() || (*src).size == 0 as libc::c_int as libc::c_ulong {
        return 0 as *mut librender_bytecode_buffer;
    }

    let mut clone: *mut librender_bytecode_buffer = librender_create_buffer((*src).capacity);

    if clone.is_null() {
        return 0 as *mut librender_bytecode_buffer;
    }

    librender_append_bytes(clone, (*src).buffer, (*src).size);

    return clone;
}

#[no_mangle]
pub unsafe extern "C" fn librender_destroy_bytecode(mut buf: *mut librender_bytecode_buffer) {
    if buf.is_null() {
        return;
    }

    librender_free_buffer(buf);
}
